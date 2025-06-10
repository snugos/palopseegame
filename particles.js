/**
 * particles.js
 * * Manages the creation and rendering of particle effects for events
 * like jumping and collecting power-ups.
 */

import { uiElements } from './ui.js';

// Array to hold all active particles
export let particles = [];

/**
 * Creates a burst of particles at a specific location.
 * @param {number} x - The starting x-coordinate.
 * @param {number} y - The starting y-coordinate.
 * @param {number} count - The number of particles to create.
 * @param {string[]} colors - An array of colors to use for the particles.
 */
export function createParticles(x, y, count, colors) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x, 
            y: y,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 3, // Random horizontal velocity
            speedY: (Math.random() - 0.5) * 3, // Random vertical velocity
            life: Math.random() * 30 + 30,     // Lifetime of the particle
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
}

/**
 * Updates the position and lifetime of all particles and draws them to the canvas.
 */
export function handleParticles() {
    const ctx = uiElements.ctx;
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life--;
        
        // Remove particles whose lifetime has expired
        if (p.life <= 0) {
            particles.splice(i, 1);
        } else {
            // Draw the particle
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 60; // Fade out as it dies
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0; // Reset global alpha
        }
    }
}
