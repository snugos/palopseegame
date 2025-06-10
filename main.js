/**
 * main.js
 * * The main entry point for the game. This file initializes the game,
 * sets up event listeners, and coordinates the other modules.
 */

import { CUSTOM_HEADER_LINK, LOCAL_HIGH_SCORE_KEY, CHEAT_CODE } from './config.js';
import { assetManager, getScaledDimensions } from './assets.js';
import { initializeAudio } from './audio.js';
import { uiElements, showMessage, resizeAndRedrawAll, drawHeaderPalopsee, handleLeaderboardModal } from './ui.js';
import { gameState, player, resetGame, startGame, gameLoop } from './game.js';

// --- STATE & INITIALIZATION ---

let userInputSequence = [];
let cheatActive = false;

/**
 * Handles the final setup steps after all assets have been loaded.
 */
function assetsReadyCallback() {
    gameState.assetsReady = true;
    const scaledPlayerDims = getScaledDimensions('palopsee');
    player.width = scaledPlayerDims.width;
    player.height = scaledPlayerDims.height;
    
    resizeAndRedrawAll(); 
    
    // Cancel any previous animation frame to prevent multiple loops
    if (gameState.animationFrameId) {
        cancelAnimationFrame(gameState.animationFrameId);
    }
    gameLoop();
    
    if (!gameState.started && !gameState.over) {
        showMessage('Ready to Fly!', 2000);
    }
}

/**
 * Initializes the entire game application.
 */
function initGame() {
    uiElements.headerLink.href = CUSTOM_HEADER_LINK;
    const savedHighScore = localStorage.getItem(LOCAL_HIGH_SCORE_KEY);
    if (savedHighScore) {
        gameState.highScore = parseInt(savedHighScore, 10);
    }

    // Set the callback for when assets are loaded
    assetManager.onAllAssetsLoaded = assetsReadyCallback;
    // Load all game assets
    assetManager.loadAll();

    // Setup UI event listeners
    setupEventListeners();
}

// --- EVENT LISTENERS ---

/**
 * Sets up all the necessary event listeners for player input and window resizing.
 */
function setupEventListeners() {
    // Keyboard input
    window.addEventListener('keydown', handleKeyDown);

    // Touch input for mobile
    document.body.addEventListener('touchstart', handleTouchStart, { passive: false });

    // Window resize
    window.addEventListener('resize', resizeAndRedrawAll);

    // Leaderboard modal buttons
    handleLeaderboardModal();
}

/**
 * Handles actions for starting the game or jumping.
 */
function handleGameAction() {
    // Initialize audio on the first user interaction
    if (!gameState.audioInitialized) {
        initializeAudio();
    }
    
    if (gameState.over) {
        resetGame();
        return;
    }
    
    if (!gameState.started && gameState.assetsReady) {
        startGame();
    } else if (gameState.started) {
        player.jump();
    }
}

/**
 * Handles keydown events for game controls and cheat codes.
 * @param {KeyboardEvent} e - The keyboard event object.
 */
function handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleGameAction();
    }

    // Cheat code logic
    userInputSequence.push(e.key);
    if (userInputSequence.length > CHEAT_CODE.length) {
        userInputSequence.shift();
    }

    if (JSON.stringify(userInputSequence) === JSON.stringify(CHEAT_CODE)) {
        cheatActive = !cheatActive;
        player.isInvincible = cheatActive;
        showMessage(cheatActive ? 'Cheat Activated: Invincibility!' : 'Cheat Deactivated!', 3000);
        userInputSequence = []; // Reset sequence after activation/deactivation
    }
}

/**
 * Handles touch events for mobile controls.
 * @param {TouchEvent} e - The touch event object.
 */
function handleTouchStart(e) {
    // Ignore touches on UI buttons
    if (e.target.closest('#headerLinkContainer') || e.target.closest('#leaderboardButton') || e.target.closest('#leaderboardModal')) {
        return;
    }
    e.preventDefault();
    handleGameAction();
}

// --- START THE GAME ---
initGame();
