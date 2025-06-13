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
        this.assets[name] = { 
            image: asset, 
            width: 0, 
            height: 0, 
            // FIX: Add a property to store the hitbox map for pixel-perfect collision.
            hitboxMap: null 
        };
        asset.onload = () => {
            this.assets[name].width = asset.naturalWidth;
            this.assets[name].height = asset.naturalHeight;
            // FIX: Generate the hitbox map after the image loads.
            this.createHitboxMap(name);
            this.assetLoaded();
        };
        asset.onerror = (err) => { 
            console.error(`Failed to load asset: ${name} at ${src}`, err);
            this.assetLoaded(); 
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
    },
    
    /**
     * FIX: Creates a 2D array representing the opaque pixels of an image.
     * This is used for more accurate collision detection.
     * @param {string} name - The name of the asset to process.
     */
    createHitboxMap(name) {
        const assetInfo = this.assets[name];
        if (!assetInfo || !assetInfo.image.complete || assetInfo.width === 0) return;

        // Create an off-screen canvas to draw the image and get its pixel data.
        const canvas = document.createElement('canvas');
        canvas.width = assetInfo.width;
        canvas.height = assetInfo.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(assetInfo.image, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const hitboxMap = [];

        for (let y = 0; y < canvas.height; y++) {
            hitboxMap[y] = [];
            for (let x = 0; x < canvas.width; x++) {
                // The alpha value is the 4th component of each pixel.
                const alpha = data[(y * canvas.width + x) * 4 + 3];
                // If alpha is greater than a threshold, consider it a solid pixel.
                hitboxMap[y][x] = alpha > 128 ? 1 : 0;
            }
        }
        assetInfo.hitboxMap = hitboxMap;
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
        return { width: baseHeight, height: baseHeight };
    }
    const aspectRatio = assetInfo.width / assetInfo.height;
    return { width: baseHeight * aspectRatio, height: baseHeight };
}
