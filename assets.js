/**
 * assets.js
 * * Contains the asset manager for loading and retrieving game images.
 */

import { imageUrls, PLAYER_SCALE_HEIGHT } from './config.js';

/**
 * Manages loading and accessing all game assets (images).
 */
export const assetManager = {
    assets: {},
    totalAssets: 0,
    loadedAssets: 0,
    onAllAssetsLoaded: null,

    /**
     * Loads a single asset.
     * @param {string} name - The key to store the asset under.
     * @param {string} src - The URL of the asset image.
     */
    loadAsset(name, src) {
        this.totalAssets++;
        const asset = new Image();
        this.assets[name] = { image: asset, width: 0, height: 0 };
        asset.onload = () => {
            this.assets[name].width = asset.naturalWidth;
            this.assets[name].height = asset.naturalHeight;
            this.assetLoaded();
        };
        asset.onerror = (err) => { 
            console.error(`Failed to load asset: ${name} at ${src}`, err);
            this.assetLoaded(); // Still count as "loaded" to not stall the game
        };
        asset.src = src;
    },

    /**
     * Kicks off the loading process for all assets defined in config.js.
     */
    loadAll() {
        Object.keys(imageUrls).forEach(name => this.loadAsset(name, imageUrls[name]));
    },

    /**
     * Called each time an asset finishes loading. Checks if all assets are loaded.
     */
    assetLoaded() {
        this.loadedAssets++;
        if (this.loadedAssets === this.totalAssets && typeof this.onAllAssetsLoaded === 'function') {
            this.onAllAssetsLoaded();
        }
    },

    /**
     * Retrieves a loaded asset.
     * @param {string} name - The name of the asset to get.
     * @returns {object|null} The asset object { image, width, height } or null.
     */
    get(name) { 
        return this.assets[name] || null;
    }
};

/**
 * Calculates the width and height for an asset based on a target height, maintaining aspect ratio.
 * @param {string} assetName - The name of the asset.
 * @param {number} [baseHeight=PLAYER_SCALE_HEIGHT] - The target height to scale to.
 * @returns {{width: number, height: number}} The new dimensions.
 */
export function getScaledDimensions(assetName, baseHeight = PLAYER_SCALE_HEIGHT) {
    const assetInfo = assetManager.get(assetName);
    if (!assetInfo || !assetInfo.height) {
        // Fallback to a square if asset info is not available
        return { width: baseHeight, height: baseHeight };
    }
    const aspectRatio = assetInfo.width / assetInfo.height;
    return { width: baseHeight * aspectRatio, height: baseHeight };
}
