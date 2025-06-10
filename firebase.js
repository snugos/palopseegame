/**
 * firebase.js
 * * Handles all interactions with Firebase services, including Authentication,
 * Firestore database operations, and calls to the Gemini API.
 */

import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import { geminiApiKey } from './config.js';
import { uiElements, showMessage } from './ui.js';

// --- FIREBASE INITIALIZATION & AUTH ---

const auth = getAuth();
const db = getFirestore();
let currentUser = null;

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        // Once authenticated, start listening for leaderboard updates
        listenForLeaderboardUpdates();
    } else {
        // If no user, sign in anonymously
        signInAnonymously(auth).catch((error) => {
            console.error("Anonymous sign-in failed:", error);
            showMessage("Could not connect to leaderboard.", 4000);
        });
    }
});

// --- FIRESTORE & LEADERBOARD ---

/**
 * Submits a new high score to the Firestore leaderboard.
 * @param {number} newScore - The new score to submit.
 */
export async function submitScore(newScore) {
    if (!currentUser) return;

    const userDocRef = doc(db, "scores", currentUser.uid);
    try {
        const userDoc = await getDoc(userDocRef);
        const existingScore = userDoc.exists() ? userDoc.data().score : 0;
        
        if (newScore > existingScore) {
            let name = userDoc.exists() ? userDoc.data().name : null;
            if (!name) {
                name = window.prompt("New high score! Enter your name for the leaderboard:", "Player");
                if (!name) name = "Anonymous"; // Default name if prompt is cancelled
            }
            
            const geminiBanterPrompt = `Generate a short, space-themed, boastful quote for a player named "${name}" who just set a high score of ${newScore}. The quote should be in the first person. Maximum 15 words.`;
            const banter = await generateGeminiText(geminiBanterPrompt);

            await setDoc(userDocRef, {
                name: name,
                score: newScore,
                userId: currentUser.uid,
                banter: banter.replace(/"/g, '') // Remove quotes from the response
            }, { merge: true });
            showMessage("High score saved to leaderboard!");
        }
    } catch (error) {
        console.error("Error submitting score:", error);
        showMessage("Failed to save high score.", 4000);
    }
}

/**
 * Sets up a real-time listener for leaderboard updates from Firestore.
 */
function listenForLeaderboardUpdates() {
    const scoresQuery = query(collection(db, "scores"), orderBy("score", "desc"), limit(10));
    onSnapshot(scoresQuery, (snapshot) => {
        uiElements.leaderboardList.innerHTML = ''; // Clear the list before repopulating
        snapshot.forEach((doc) => {
            const data = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `<div class="score-line"><span class="player-name">${data.name}</span><span>${data.score}</span></div>
                            ${data.banter ? `<div class="banter">"${data.banter}"</div>` : ''}`;
            uiElements.leaderboardList.appendChild(li);
        });
    }, (error) => {
        console.error("Leaderboard snapshot error:", error);
        showMessage("Could not load leaderboard. Check Firestore rules.", 5000);
    });
}


// --- GEMINI API ---

/**
 * Generates text using the Gemini API for game over messages and banter.
 * @param {string} geminiPrompt - The prompt to send to the API.
 * @returns {Promise<string>} A promise that resolves to the generated text.
 */
export async function generateGeminiText(geminiPrompt) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    const payload = {
        contents: [{ role: "user", parts: [{ text: geminiPrompt }] }]
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Gemini API Error:", response.status, errorBody);
            return "My circuits are a little fried right now.";
        }

        const result = await response.json();
        if (result.candidates && result.candidates.length > 0) {
            return result.candidates[0].content.parts[0].text;
        }
        return "Couldn't think of anything clever.";
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "My circuits are buzzing...";
    }
}
