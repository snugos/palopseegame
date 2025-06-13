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
import { addScore, getScores } from './leaderboard.js';

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
    cheatActive: false,
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
        
        if (this.isInvincible && this.invincibilityFrames++ % 10 < 5) {
            // Blinking effect
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

export function startGame() {
    gameState.started = true;
    gameState.score = 0;
    gameState.speed = INITIAL_GAME_SPEED;
    player.jump();
}

export function resetGame() {
    gameState.score = 0;
    gameState.speed = INITIAL_GAME_SPEED;
    gameState.over = false;
    gameState.started = false;
    player.isInvincible = gameState.cheatActive;
    gameState.nextPowerUpPatternBase = 0;
    gameState.nextPowerUpIndex = 0;

    obstacles = [];
    powerUps = [];
    player.dy = 0;
    player.isJumping = false;
    player.y = player.restingY;
    
    uiElements.messageBox.style.display = 'none';
}

function setGameOver() {
    if (gameState.over) return;
    gameState.over = true;
    gameState.started = false;
    player.isInvincible = false;
    createParticles(player.x + player.width / 2, player.y + player.height / 2, 30, ['#333333']);

    const topScores = getScores();
    const lowestTopScore = topScores.length < 10 ? 0 : topScores[topScores.length - 1];

    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem(LOCAL_HIGH_SCORE_KEY, gameState.highScore);
    }
    
    if (gameState.score > 0 && gameState.score > lowestTopScore) {
        addScore(gameState.score);
        showMessage("New top score added to your leaderboard!");
    }

    playGameOverSound(); 
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
        const verticalCenter = uiElements.gameCanvas.height / 2;
        yPos = verticalCenter + (Math.random() * player.height * 0.5);
    } else { 
        const alienShipClearance = 20;
        yPos = player.restingY - alienShipClearance - scaledDims.height;
        if (yPos < 10) yPos = 10;
    }

    obstacles.push({ 
        x: uiElements.gameCanvas.width, y: yPos, width: scaledDims.width, height: scaledDims.height,
        asset: assetInfo,
        isAsteroid: isAsteroid,
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
    const yPos = player.restingY + (player.height / 2) - (scaledDims.height / 2);
    
    const pUp = {
        x: uiElements.gameCanvas.width, y: yPos, width: scaledDims.width, height: scaledDims.height, image: assetInfo.image,
        draw() { if (this.image.complete) uiElements.ctx.drawImage(this.image, this.x, this.y, this.width, this.height); },
        update(currentSpeed) { this.x -= currentSpeed; }
    };
    powerUps.push(pUp);
}

function checkPixelCollision(player, obstacle) {
    const playerAsset = assetManager.get('palopsee');
    const obstacleAsset = obstacle.asset;

    if (!playerAsset.hitboxMap || !obstacleAsset.hitboxMap) {
        // Fallback to simple box collision if hitbox maps are not ready.
        return (
            player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y
        );
    }
    
    // Determine the overlapping area to check for collisions.
    const xStart = Math.max(player.x, obstacle.x);
    const xEnd = Math.min(player.x + player.width, obstacle.x + obstacle.width);
    const yStart = Math.max(player.y, obstacle.y);
    const yEnd = Math.min(player.y + player.height, obstacle.y + obstacle.height);

    for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
            // Convert world coordinates to local image coordinates.
            const playerImgX = Math.floor(((x - player.x) / player.width) * playerAsset.width);
            const playerImgY = Math.floor(((y - player.y) / player.height) * playerAsset.height);
            const obsImgX = Math.floor(((x - obstacle.x) / obstacle.width) * obstacleAsset.width);
            const obsImgY = Math.floor(((y - obstacle.y) / obstacle.height) * obstacleAsset.height);
            
            // Check if both pixels are solid (not transparent).
            if (playerAsset.hitboxMap[playerImgY]?.[playerImgX] && obstacleAsset.hitboxMap[obsImgY]?.[obsImgX]) {
                return true; // Collision detected.
            }
        }
    }
    return false; // No collision.
}

function handleObstacles(currentSpeed) {
    const spawnMinDistance = uiElements.gameCanvas.width * 0.4 + currentSpeed * 10; 
    const spawnRandomDistance = uiElements.gameCanvas.width * 0.3;

    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < uiElements.gameCanvas.width - spawnMinDistance - Math.random() * spawnRandomDistance) {
         if (Math.random() < (0.015 + gameState.speed * 0.0005)) createObstacle();
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.update(currentSpeed);
        
        // Use the new pixel-perfect collision detection.
        if (!player.isInvincible && checkPixelCollision(player, obs)) {
            setGameOver();
            return; 
        }

        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            gameState.score++;
            if(gameState.score % 10 === 0) playScoreSound();
        }
    }
}

function handlePowerUps(currentSpeed) {
    const nextSpawnScore = POWERUP_SPAWN_SCORES[gameState.nextPowerUpIndex] + gameState.nextPowerUpPatternBase;

    if (powerUps.length === 0 && gameState.score >= nextSpawnScore) {
        createPowerUp();
        gameState.nextPowerUpIndex++;
        if (gameState.nextPowerUpIndex >= POWERUP_SPAWN_SCORES.length) {
            gameState.nextPowerUpIndex = 0;
            gameState.nextPowerUpPatternBase += POWERUP_PATTERN_INTERVAL;
        }
    }

    for (let i = powerUps.length - 1; i >= 0; i--) {
        const pUp = powerUps[i];
        pUp.update(currentSpeed);

        if (player.x < pUp.x + pUp.width && player.x + player.width > pUp.x && player.y < pUp.y + pUp.height && player.y + player.height > pUp.y) {
            player.isInvincible = true;
            player.invincibilityFrames = 0; 
            playPowerUpSound();
            createParticles(pUp.x + pUp.width / 2, pUp.y + pUp.height / 2, 20, ['#FFFFFF', '#333333']);
            powerUps.splice(i, 1); 
            
            setTimeout(() => { 
                if (!gameState.cheatActive) {
                    player.isInvincible = false;
                }
            }, 5000); 
        }
        if (pUp.x + pUp.width < 0) powerUps.splice(i, 1);
    }
}


// --- MAIN GAME LOOP ---

export function gameLoop() {
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
    const { ctx } = uiElements;

    if (gameState.started && !gameState.over) {
        uiElements.backgroundOffsetX -= gameState.speed * 0.5;
    }
    uiElements.drawScrollingFullScreenBackground(); 
    ctx.clearRect(0, 0, uiElements.gameCanvas.width, uiElements.gameCanvas.height); 
    
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

    ctx.font = `16px ${GAME_FONT}`; 
    ctx.fillStyle = '#333333'; 
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${gameState.score}`, 10, 25);
    ctx.fillText(`Local High Score: ${gameState.highScore}`, 10, 50);

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
