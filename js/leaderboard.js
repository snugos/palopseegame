/**
 * leaderboard.js
 * * Manages the local leaderboard using localStorage.
 */

import { uiElements } from './ui.js';

// The key used to store leaderboard data in localStorage.
const LEADERBOARD_KEY = 'palopseeLocalLeaderboard';

/**
 * Retrieves the list of scores from localStorage.
 * @returns {Array} An array of score objects, sorted from highest to lowest.
 */
export function getScores() {
    const scoresJSON = localStorage.getItem(LEADERBOARD_KEY);
    if (!scoresJSON) {
        return [];
    }
    try {
        const scores = JSON.parse(scoresJSON);
        // Ensure scores are sorted correctly every time they are retrieved.
        return scores.sort((a, b) => b.score - a.score);
    } catch (e) {
        console.error("Error parsing leaderboard scores from localStorage", e);
        return [];
    }
}

/**
 * Adds a new score to the leaderboard.
 * @param {string} name - The player's name.
 * @param {number} score - The player's score.
 */
export function addScore(name, score) {
    const scores = getScores();
    scores.push({ name, score });
    
    // Sort scores and keep only the top 10.
    const sortedScores = scores.sort((a, b) => b.score - a.score);
    const topScores = sortedScores.slice(0, 10);
    
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(topScores));
}

/**
 * Populates the leaderboard modal with the current scores.
 */
export function displayLeaderboard() {
    const scores = getScores();
    const list = uiElements.leaderboardList;
    list.innerHTML = ''; // Clear existing list.

    if (scores.length === 0) {
        list.innerHTML = '<li>No scores yet. Be the first!</li>';
        return;
    }

    scores.forEach(scoreEntry => {
        const li = document.createElement('li');
        // We no longer have banter, so the structure is simpler.
        li.innerHTML = `<div class="score-line"><span class="player-name">${scoreEntry.name}</span><span>${scoreEntry.score}</span></div>`;
        list.appendChild(li);
    });
}
