/**
 * config.js
 * * Contains all the configuration and constant values for the game.
 * This includes game settings, asset URLs, and API keys.
 */

// Game Asset URLs
// FIX: Updated all asset URLs to point to the new location.
export const imageUrls = {
    palopsee: 'http://snugos.github.io/palopseegame/palopsee.png',
    background: 'http://snugos.github.io/palopseegame/background.png',
    alienShip: 'http://snugos.github.io/palopseegame/alien1.png',
    powerUp: 'http://snugos.github.io/palopseegame/star1.png',
    asteroid: 'http://snugos.github.io/palopseegame/asteroid1.gif'
};

// Sizing and Scaling Constants
export const PLAYER_SCALE_HEIGHT = 52;
export const POWERUP_SCALE_HEIGHT = 32;
export const HEADER_ICON_SIZE = 40;
export const BACKGROUND_TILE_WIDTH = 200;
export const BACKGROUND_TILE_HEIGHT = 150;

export const ASTEROID_SCALE_HEIGHT = 30;
export const ALIEN_SCALE_HEIGHT = 58;    

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
