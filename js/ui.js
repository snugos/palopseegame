/**
 * ui.js
 * * Manages all direct DOM interactions, UI updates, and canvas setup.
 * This includes selecting elements, drawing UI components, and handling window resizing.
 */

import { assetManager } from './assets.js';
import { gameState, player } from './game.js';
import { BACKGROUND_TILE_WIDTH, BACKGROUND_TILE_HEIGHT, HEADER_ICON_SIZE } from './config.js';

// --- DOM ELEMENT SELECTION ---

// Select all necessary DOM elements and export them for use in other modules.
export const uiElements = {
    gameCanvas: document.getElementById('gameCanvas'),
    ctx: document.getElementById('gameCanvas').getContext('2d'),
    backgroundCanvas: document.getElementById('backgroundCanvas'),
    bgCtx: document.getElementById('backgroundCanvas').getContext('2d'),
    headerPalopseeCanvas: document.getElementById('headerPalopseeCanvas'),
    headerPalopseeCtx: document.getElementById('headerPalopseeCanvas').getContext('2d'),
    headerLink: document.getElementById('headerLink'),
    messageBox: document.getElementById('messageBox'),
    leaderboardButton: document.getElementById('leaderboardButton'),
    leaderboardModal: document.getElementById('leaderboardModal'),
    closeLeaderboardButton: document.getElementById('closeLeaderboard'),
    leaderboardList: document.getElementById('leaderboardList'),
    backgroundPattern: null,
    bgPatternCanvas: null,
    backgroundOffsetX: 0,
    drawScrollingFullScreenBackground, // Add function to the export
};

// --- UI FUNCTIONS ---

/**
 * Displays a message in the message box for a set duration.
 * @param {string} msg - The message to display.
 * @param {number} [duration=3000] - How long to display the message in milliseconds.
 */
export function showMessage(msg, duration = 3000) {
    uiElements.messageBox.textContent = msg;
    uiElements.messageBox.style.display = "block";
    setTimeout(() => { uiElements.messageBox.style.display = "none" }, duration);
}

/**
 * Draws the Palopsee icon in the header.
 */
export function drawHeaderPalopsee() {
    const { headerPalopseeCanvas, headerPalopseeCtx } = uiElements;
    const pAsset = assetManager.get('palopsee');
    headerPalopseeCanvas.width = HEADER_ICON_SIZE;
    headerPalopseeCanvas.height = HEADER_ICON_SIZE;
    headerPalopseeCtx.clearRect(0, 0, HEADER_ICON_SIZE, HEADER_ICON_SIZE);
    if (pAsset?.image.complete) {
        headerPalopseeCtx.drawImage(pAsset.image, 0, 0, HEADER_ICON_SIZE, HEADER_ICON_SIZE);
    }
}

/**
 * Handles showing and hiding the leaderboard modal.
 * This now includes a touchstart event for better mobile compatibility.
 */
export function handleLeaderboardModal() {
    uiElements.leaderboardButton.addEventListener('click', () => {
        uiElements.leaderboardModal.style.display = 'flex';
    });

    const closeAction = (e) => {
        e.preventDefault(); // Prevents potential "ghost clicks" on mobile
        uiElements.leaderboardModal.style.display = 'none';
    };

    uiElements.closeLeaderboardButton.addEventListener('click', closeAction);
    uiElements.closeLeaderboardButton.addEventListener('touchstart', closeAction);
}


// --- CANVAS & DRAWING FUNCTIONS ---

/**
 * Creates the repeatable tile for the scrolling background.
 */
function createBackgroundPatternTile() {
    const bgInfo = assetManager.get('background');
    if (bgInfo?.image.complete) {
        uiElements.bgPatternCanvas = document.createElement("canvas");
        uiElements.bgPatternCanvas.width = BACKGROUND_TILE_WIDTH;
        uiElements.bgPatternCanvas.height = BACKGROUND_TILE_HEIGHT;
        const pCtx = uiElements.bgPatternCanvas.getContext("2d");
        pCtx.drawImage(bgInfo.image, 0, 0, uiElements.bgPatternCanvas.width, uiElements.bgPatternCanvas.height);
        
        // After creating the tile, create the actual pattern from it.
        if (uiElements.bgPatternCanvas && uiElements.bgCtx) {
            uiElements.backgroundPattern = uiElements.bgCtx.createPattern(uiElements.bgPatternCanvas, "repeat");
        }
    } else {
        uiElements.bgPatternCanvas = null;
        uiElements.backgroundPattern = null;
    }
}

/**
 * Draws the scrolling background using a repeating pattern.
 */
function drawScrollingFullScreenBackground() { 
    const { bgCtx, backgroundCanvas, backgroundPattern, bgPatternCanvas } = uiElements;
    if (!bgCtx) return;

    bgCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    if (backgroundPattern && bgPatternCanvas) {
        bgCtx.save();
        bgCtx.globalAlpha = 0.1; // Make background faint
        let pOffsetX = uiElements.backgroundOffsetX % bgPatternCanvas.width;
        bgCtx.translate(pOffsetX, 0);
        bgCtx.fillStyle = backgroundPattern;
        bgCtx.fillRect(-pOffsetX, 0, backgroundCanvas.width + bgPatternCanvas.width, backgroundCanvas.height); 
        bgCtx.restore();
    } else {
        // Fallback solid color if the pattern fails to load
        bgCtx.fillStyle = '#ffffff';
        bgCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    }
}


/**
 * Resizes all canvases to fit the window and redraws static elements.
 */
export function resizeAndRedrawAll() {
    const { gameCanvas, backgroundCanvas } = uiElements;
    const width = window.innerWidth;
    const height = window.innerHeight;

    backgroundCanvas.width = width;
    backgroundCanvas.height = height;
    gameCanvas.width = width;
    gameCanvas.height = height;

    // Recalculate player's resting position
    player.restingY = height / 2 - player.height / 2;
    if (!gameState.started) {
        player.y = player.restingY;
    }
    
    createBackgroundPatternTile();
    drawHeaderPalopsee();
}
