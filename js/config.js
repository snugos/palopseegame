/**
 * config.js
 * * Contains all the configuration and constant values for the game.
 * This includes game settings, asset URLs, and API keys.
 */

// Firebase Configuration
export const firebaseConfig = {
    apiKey: "AIzaSyDKcumpOoSW3T3qdsNJWFFhje_CCOL-U10",
    authDomain: "palopsee-2d584.firebaseapp.com",
    projectId: "palopsee-2d584",
    storageBucket: "palopsee-2d584.appspot.com",
    messagingSenderId: "516105281244",
    appId: "1:516105281244:web:79007aa6c2ae98deac9e19",
    measurementId: "G-E1F0FXCS56"
};

// Gemini API Key
export const geminiApiKey = "AIzaSyCmBgtVM3y9bHpf1Q3kGFieNi4wc5H41M8";

// Game Asset URLs
export const imageUrls = {
    palopsee: 'https://palopsee.netlify.app/palopsee.png',
    background: 'https://palopsee.netlify.app/background.png',
    alienShip: 'https://palopsee.netlify.app/alien1.png',
    powerUp: 'https://palopsee.netlify.app/star1.png',
    asteroid: 'https://palopsee.netlify.app/asteroid1.gif'
};

// Sizing and Scaling Constants
// FIX: Increased player size from 48 to 52
export const PLAYER_SCALE_HEIGHT = 52;
export const POWERUP_SCALE_HEIGHT = 32;
export const HEADER_ICON_SIZE = 40;
export const BACKGROUND_TILE_WIDTH = 200;
export const BACKGROUND_TILE_HEIGHT = 150;

export const ASTEROID_SCALE_HEIGHT = 38; 
export const ALIEN_SCALE_HEIGHT = 52;    

// Gameplay Constants
export const INITIAL_GAME_SPEED = 6;
export const MAX_GAME_SPEED = 13; 
export const GAME_SPEED_INCREASE_FACTOR = 0.001;
export const MILESTONE_SPEED_BONUS = 0.5;
export const LOCAL_HIGH_SCORE_KEY = 'palopseeGameHighScore_local';
export const GAME_FONT = "'Pixelify Sans', 'Inter', sans-serif";
export const CUSTOM_HEADER_LINK = "https://palopsee.univer.se/";

// Specific scores for power-up spawns
export const POWERUP_SPAWN_SCORES = [10, 30, 60, 90, 100];
export const POWERUP_PATTERN_INTERVAL = 100;

// Cheat Code
export const CHEAT_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
