/**
 * leaderboard.js
 * * Manages the local leaderboard using localStorage.
 */

import { uiElements } from './ui.js';

// The key used to store leaderboard data in localStorage.
const LEADERBOARD_KEY = 'palopseeTopScores';

/**
 * Retrieves the list of scores from localStorage.
 * @returns {Array<number>} An array of scores, sorted from highest to lowest.
 */
export function getScores() {
    const scoresJSON = localStorage.getItem(LEADERBOARD_KEY);
    if (!scoresJSON) {
        return [];
    }
    try {
        const scores = JSON.parse(scoresJSON);
        // Ensure scores are sorted correctly every time they are retrieved.
        return scores.sort((a, b) => b - a);
    } catch (e) {
        console.error("Error parsing leaderboard scores from localStorage", e);
        return [];
    }
}

/**
 * Adds a new score to the leaderboard.
 * @param {number} score - The player's score.
 */
export function addScore(score) {
    const scores = getScores();
    scores.push(score);
    
    // Sort scores and keep only the top 10.
    const sortedScores = scores.sort((a, b) => b - a);
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

    scores.forEach((score, index) => {
        const li = document.createElement('li');
        // FIX: Display a ranked list of scores.
        li.innerHTML = `<span class="rank">#${index + 1}</span><span class="score">${score}</span>`;
        list.appendChild(li);
    });
}
