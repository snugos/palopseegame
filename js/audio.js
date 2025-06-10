/**
 * audio.js
 * * Handles all audio-related functionality using Tone.js.
 * This includes initializing synths and playing sound effects.
 */

import { gameState } from './game.js';

let jumpSynth, scoreSynth, gameOverSynth, powerUpSynth;
let jumpSoundCooldown = false;

/**
 * Initializes the Tone.js audio context and synthesizers.
 * This must be called after a user interaction.
 */
export function initializeAudio() {
    if (Tone.context.state !== 'running') {
        Tone.start();
    }
    if (gameState.audioInitialized) return;
    
    gameState.audioInitialized = true;
    
    // Define the different synthesizers for game sounds
    jumpSynth = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.01, release: 0.1 } }).toDestination();
    scoreSynth = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.05, sustain: 0, release: 0.1 } }).toDestination();
    gameOverSynth = new Tone.NoiseSynth({ noise: { type: 'brown' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.1 } }).toDestination();
    powerUpSynth = new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 } }).toDestination();
}

// --- Sound Effect Functions ---

export function playJumpSound() { 
    if (gameState.audioInitialized && !jumpSoundCooldown) {
        jumpSynth.triggerAttackRelease('C5', '8n', Tone.now());
        jumpSoundCooldown = true;
        setTimeout(() => { jumpSoundCooldown = false; }, 100); // Cooldown to prevent sound spam
    }
}

export function playScoreSound() { 
    if (gameState.audioInitialized) {
        scoreSynth.triggerAttackRelease('A5', '16n', Tone.now());
    }
}

export function playGameOverSound() { 
    if (gameState.audioInitialized) {
        gameOverSynth.triggerAttackRelease('16n', Tone.now());
    }
}

export function playPowerUpSound() { 
    if (gameState.audioInitialized) {
        powerUpSynth.triggerAttackRelease('G5', '8n', Tone.now());
    }
}
