const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Enable CORS for frontend-backend communication
app.use(cors());
app.use(express.json());

// Path to the leaderboard JSON file
const leaderboardFilePath = path.join(__dirname, 'leaderboard.json');

// Load leaderboard data from file
function loadLeaderboard() {
    if (!fs.existsSync(leaderboardFilePath)) {
        fs.writeFileSync(leaderboardFilePath, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(leaderboardFilePath));
}

// Save leaderboard data to file
function saveLeaderboard(leaderboard) {
    fs.writeFileSync(leaderboardFilePath, JSON.stringify(leaderboard, null, 2));
}

// Get leaderboard
app.get('/leaderboard', (req, res) => {
    const leaderboard = loadLeaderboard();
    res.json(leaderboard);
});

// Submit score
app.post('/submit-score', (req, res) => {
    const { username, score } = req.body;

    if (!username || !score) {
        return res.status(400).json({ error: 'Username and score are required' });
    }

    const leaderboard = loadLeaderboard();

    // Check if the user already exists
    const userIndex = leaderboard.findIndex(entry => entry.username === username);

    if (userIndex !== -1) {
        // Update the user's score if it's higher
        if (score > leaderboard[userIndex].score) {
            leaderboard[userIndex].score = score;
        }
    } else {
        // Add a new entry for the user
        leaderboard.push({ username, score });
    }

    // Sort by score (descending)
    leaderboard.sort((a, b) => b.score - a.score);

    // Keep only top 10 entries
    const top10 = leaderboard.slice(0, 10);

    // Save the updated leaderboard
    saveLeaderboard(top10);

    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});