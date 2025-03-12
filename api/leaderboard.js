const fs = require('fs');
const path = require('path');

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

module.exports = async (req, res) => {
    if (req.method === 'GET') {
        // Handle GET request (fetch leaderboard)
        const leaderboard = loadLeaderboard();
        res.status(200).json(leaderboard);
    } else if (req.method === 'POST') {
        // Handle POST request (submit score)
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

        res.status(200).json({ success: true });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};