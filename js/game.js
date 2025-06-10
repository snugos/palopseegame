/**
 * game.js
 * * This module contains the core game logic, including the player,
 * obstacles, power-ups, game state, and the main game loop.
 */

import { 
    PLAYER_SCALE_HEIGHT, 
    ALIEN_SCALE_HEIGHT, 
    ASTEROID_SCALE_HEIGHT,
    POWERUP_SCALE_HEIGHT,
    INITIAL_GAME_SPEED,
    GAME_SPEED_INCREASE_FACTOR,
    MILESTONE_SPEED_BONUS,
    MAX_GAME_SPEED,
    LOCAL_HIGH_SCORE_KEY,
    GAME_FONT,
    POWERUP_SPAWN_SCORES,
    POWERUP_PATTERN_INTERVAL
} from './config.js';
import { assetManager, getScaledDimensions } from './assets.js';
import { playJumpSound, playScoreSound, playGameOverSound, playPowerUpSound } from './audio.js';
import { particles, createParticles, handleParticles } from './particles.js';
import { uiElements, showMessage } from './ui.js';
import { submitScore, generateGeminiText } from './firebase.js';

// --- GAME STATE & ENTITIES ---

export const gameState = {
    started: false,
    over: false,
    assetsReady: false,
    audioInitialized: false,
    speed: INITIAL_GAME_SPEED,
    score: 0,
    highScore: 0,
    animationFrameId: null,
    geminiMessage: '',
    isGeneratingMessage: false,
    // Power-up spawning state
    nextPowerUpPatternBase: 0,
    nextPowerUpIndex: 0
};

export const player = {
    x: 50, y: 0, width: 0, height: 0,
    dy: 0, jumpStrength: 12, gravity: 0.7,   
    isJumping: false, 
    restingY: 0, 
    isInvincible: false, 
    invincibilityFrames: 0, 
    draw() {
        const palopseeAsset = assetManager.get('palopsee');
        if (!palopseeAsset?.image.complete) return;
        
        // Blink when invincible
        if (this.isInvincible && this.invincibilityFrames++ % 10 < 5) {
            // Render nothing to create a "blink" effect
        } else {
            uiElements.ctx.drawImage(palopseeAsset.image, this.x, this.y, this.width, this.height);
        }
    },
    jump() {
        if (!this.isJumping && !gameState.over && gameState.started) { 
            this.isJumping = true;
            this.dy = -this.jumpStrength;
            playJumpSound(); 
            createParticles(this.x + this.width / 2, this.y + this.height, 5, ['#FFFFFF', '#333333']);
        }
    },
    update() {
        if (this.isJumping) {
            this.y += this.dy;
            this.dy += this.gravity;
        }
        // Land on the resting position
        if (this.y >= this.restingY && this.dy > 0) {
            this.y = this.restingY;
            this.isJumping = false;
            this.dy = 0;
        }
    }
};

let obstacles = [];
let powerUps = [];

// --- GAME LIFECYCLE FUNCTIONS ---

/**
 * Starts the game.
 */
export function startGame() {
    gameState.started = true;
    gameState.score = 0;
    gameState.speed = INITIAL_GAME_SPEED;
    player.jump();
}

/**
 * Resets the game to its initial state.
 */
export function resetGame() {
    gameState.score = 0;
    gameState.speed = INITIAL_GAME_SPEED;
    gameState.over = false;
    gameState.started = false;
    gameState.geminiMessage = '';
    gameState.isGeneratingMessage = false;
    gameState.nextPowerUpPatternBase = 0;
    gameState.nextPowerUpIndex = 0;

    obstacles = [];
    powerUps = [];
    player.dy = 0;
    player.isJumping = false;
    player.isInvincible = false;
    player.y = player.restingY;
    
    uiElements.messageBox.style.display = 'none';
}

/**
 * Ends the game, calculates high scores, and displays the game over screen.
 */
async function setGameOver() {
    if (gameState.over) return;
    gameState.over = true;
    gameState.started = false;
    player.isInvincible = false;
    createParticles(player.x + player.width / 2, player.y + player.height / 2, 30, ['#333333']);

    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem(LOCAL_HIGH_SCORE_KEY, gameState.highScore);
        await submitScore(gameState.score);
    }
    playGameOverSound(); 

    gameState.isGeneratingMessage = true;
    gameState.geminiMessage = 'Thinking of a witty remark...';
    const geminiPrompt = `Generate a short, witty, encouraging, or funny message for a player who just got a score of ${gameState.score} in a space-themed endless runner game. The character's name is Palopsee. Be slightly sarcastic. Keep it under 20 words.`;
    
    generateGeminiText(geminiPrompt).then(text => {
        gameState.geminiMessage = text.replace(/"/g, '');
        gameState.isGeneratingMessage = false;
    });
}

// --- ENTITY CREATION & MANAGEMENT ---

function createObstacle() {
    const isAsteroid = Math.random() < 0.6;
    const assetName = isAsteroid ? 'asteroid' : 'alienShip';
    const scaleHeight = isAsteroid ? ASTEROID_SCALE_HEIGHT : ALIEN_SCALE_HEIGHT;

    const assetInfo = assetManager.get(assetName);
    if (!assetInfo || assetInfo.width === 0) return;

    const scaledDims = getScaledDimensions(assetName, scaleHeight);
    let yPos;

    if (isAsteroid) {
        // Asteroids can appear at various heights around the center
        const verticalCenter = uiElements.gameCanvas.height / 2;
        yPos = verticalCenter - scaledDims.height / 2 + (Math.random() * player.height - player.height / 2);
    } else { 
        // Alien ships fly above the player
        const alienShipClearance = 10;
        yPos = player.restingY - alienShipClearance - scaledDims.height;
        if (yPos < 10) yPos = 10; // Ensure it doesn't go off-screen
    }

    obstacles.push({ 
        x: uiElements.gameCanvas.width, y: yPos, width: scaledDims.width, height: scaledDims.height,
        asset: assetInfo,
        draw() { 
            if (this.asset.image.complete) {
                uiElements.ctx.drawImage(this.asset.image, this.x, this.y, this.width, this.height);
            }
        }, 
        update(currentSpeed) { this.x -= currentSpeed; } 
    });
}

function createPowerUp() {
    const assetInfo = assetManager.get('powerUp');
    if (!assetInfo?.width) return;

    const scaledDims = getScaledDimensions('powerUp', POWERUP_SCALE_HEIGHT);
    const verticalCenter = uiElements.gameCanvas.height / 2;
    const yPos = verticalCenter - scaledDims.height / 2 + (Math.random() * (player.height * 2) - player.height);
    
    const pUp = {
        x: uiElements.gameCanvas.width, y: yPos, width: scaledDims.width, height: scaledDims.height, image: assetInfo.image,
        draw() { if (this.image.complete) uiElements.ctx.drawImage(this.image, this.x, this.y, this.width, this.height); },
        update(currentSpeed) { this.x -= currentSpeed; }
    };
    // Ensure power-up is within bounds
    if (pUp.y < 20) pUp.y = 20;
    if (pUp.y + pUp.height > uiElements.gameCanvas.height - 20) pUp.y = uiElements.gameCanvas.height - 20 - pUp.height;
    powerUps.push(pUp);
}

function handleObstacles(currentSpeed) {
    const spawnMinDistance = uiElements.gameCanvas.width * 0.4 + currentSpeed * 10; 
    const spawnRandomDistance = uiElements.gameCanvas.width * 0.3;

    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < uiElements.gameCanvas.width - spawnMinDistance - Math.random() * spawnRandomDistance) {
         if (Math.random() < (0.015 + gameState.speed * 0.0005)) createObstacle();
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update(currentSpeed);
        
        // Collision detection
        if (!player.isInvincible && player.x < obstacles[i].x + obstacles[i].width && player.x + player.width > obstacles[i].x && player.y < obstacles[i].y + obstacles[i].height && player.y + player.height > obstacles[i].y) {
            setGameOver();
            return; 
        }

        // Remove off-screen obstacles and increase score
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            gameState.score++;
            if(gameState.score % 10 === 0) playScoreSound(); // Sound every 10 points
        }
    }
}

function handlePowerUps(currentSpeed) {
    // Determine the next score to spawn a power-up
    const nextSpawnScore = POWERUP_SPAWN_SCORES[gameState.nextPowerUpIndex] + gameState.nextPowerUpPatternBase;

    if (powerUps.length === 0 && gameState.score >= nextSpawnScore) {
        createPowerUp();
        // Move to the next spawn score in the pattern
        gameState.nextPowerUpIndex++;
        // If pattern is complete, reset it for the next interval
        if (gameState.nextPowerUpIndex >= POWERUP_SPAWN_SCORES.length) {
            gameState.nextPowerUpIndex = 0;
            gameState.nextPowerUpPatternBase += POWERUP_PATTERN_INTERVAL;
        }
    }

    for (let i = powerUps.length - 1; i >= 0; i--) {
        const pUp = powerUps[i];
        pUp.update(currentSpeed);

        // Collision detection
        if (player.x < pUp.x + pUp.width && player.x + player.width > pUp.x && player.y < pUp.y + pUp.height && player.y + player.height > pUp.y) {
            player.isInvincible = true;
            player.invincibilityFrames = 0; 
            playPowerUpSound();
            createParticles(pUp.x + pUp.width / 2, pUp.y + pUp.height / 2, 20, ['#FFFFFF', '#333333']);
            powerUps.splice(i, 1); 
            
            // Invincibility wears off after 5 seconds
            setTimeout(() => { 
                // Only turn off if a new power-up hasn't been collected
                if(player.invincibilityFrames > 300) player.isInvincible = false;
            }, 5000); 
        }
        if (pUp.x + pUp.width < 0) powerUps.splice(i, 1);
    }
}


// --- MAIN GAME LOOP ---

export function gameLoop() {
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
    const { ctx, bgCtx, backgroundCanvas } = uiElements;

    // Update and draw background
    if (gameState.started && !gameState.over) {
        uiElements.backgroundOffsetX -= gameState.speed * 0.5; // Slower scroll for parallax
    }
    uiElements.drawScrollingFullScreenBackground(); 
    ctx.clearRect(0, 0, uiElements.gameCanvas.width, uiElements.gameCanvas.height); 
    
    // Calculate current speed based on T-Rex game model
    const speedBonus = Math.floor(gameState.score / 100) * MILESTONE_SPEED_BONUS;
    const currentSpeed = Math.min(MAX_GAME_SPEED, gameState.speed + speedBonus);

    if (gameState.started && !gameState.over) {
        player.update();
        handleObstacles(currentSpeed); 
        handlePowerUps(currentSpeed);
        gameState.speed += GAME_SPEED_INCREASE_FACTOR;
    }
    
    player.draw();
    obstacles.forEach(obs => obs.draw());
    powerUps.forEach(pUp => pUp.draw());
    handleParticles(); 

    // Draw UI Text (Score, etc.)
    ctx.font = `16px ${GAME_FONT}`; 
    ctx.fillStyle = '#333333'; 
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${gameState.score}`, 10, 25);
    ctx.fillText(`Local High Score: ${gameState.highScore}`, 10, 50);

    // Draw Game Over or Start Screen
    if (gameState.over) {
        drawGameOverScreen(ctx);
    } else if (!gameState.started && gameState.assetsReady) {
        drawStartScreen(ctx);
    }
}

// --- DRAWING HELPERS ---

function drawGameOverScreen(ctx) {
    const { width, height } = uiElements.gameCanvas;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'; 
    ctx.fillRect(0, 0, width, height); 
    ctx.font = `40px ${GAME_FONT}`; 
    ctx.fillStyle = '#FFFFFF'; 
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', width / 2, height / 2 - 60);
    ctx.font = `20px ${GAME_FONT}`; 
    ctx.fillText(`Score: ${gameState.score}`, width / 2, height / 2 - 20);
    ctx.fillText(`High Score: ${gameState.highScore}`, width / 2, height / 2 + 10);
    
    ctx.font = `italic 16px ${GAME_FONT}`;
    ctx.fillText(gameState.geminiMessage, width / 2, height / 2 + 50);
    
    ctx.font = `16px ${GAME_FONT}`; 
    ctx.fillText('Tap or Press Space/Up to Restart', width / 2, height / 2 + 90);
}

function drawStartScreen(ctx) {
    const { width, height } = uiElements.gameCanvas;
    ctx.font = `20px ${GAME_FONT}`; 
    ctx.textAlign = 'center';
    const promptText = 'Tap Screen or Press Space/Up to Start!';
    const textMetrics = ctx.measureText(promptText);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(width / 2 - textMetrics.width / 2 - 10, height - 80, textMetrics.width + 20, 30);
    ctx.fillStyle = '#000000';
    ctx.fillText(promptText, width / 2, height - 60);
}

