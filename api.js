const express = require('express');
const router = express.Router();
const User = require('./mongodb/user-db-model');
const GameData = require('./mongodb/game-db-model');
const APIUser = require('./mongodb/api-user-model');
const getGameCode = require('./get-latest-game-code');
const getMatchId = require('./get-match-id');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('./token');

//REQUEST
//http://localhost:3000/cs/register?steamId=76561198159334860&matchAuthId=7TKC-2W7HY-BYLM&lastMatchId=CSGO-jXhtq-dWhbp-NkABi-9svB6-ZympQ&discordId=385123236670865418


router.get('/register', verifyToken, async (req, res) => {
    // Check if all required parameters are provided
    const { steamId, matchAuthId, lastMatchId, discordId } = req.query;
    if (!steamId || !matchAuthId || !lastMatchId || !discordId) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const existingUser = await User.find({ discordId }).exec();
    if (existingUser.length > 0) {
        return res.status(400).json({ error: `User already exists` });
    } else {
        try {
            console.log(steamId, matchAuthId, lastMatchId);
            const newLastMatchId = await getGameCode.makeAPICallWithCode(steamId, matchAuthId, lastMatchId);
            const matchId = await getMatchId.getMatchId(newLastMatchId);
            let lastMatchDataSend = false;

            // Create a new user document and save it to the database
            const newUser = new User({
                discordId,
                steamId,
                matchAuthId,
                lastMatchId: newLastMatchId,
                matchId,
                firstMatchId: lastMatchId,
                lastMatchDataSend,
                lastMatchUpdate: new Date()
            });

            await newUser.save();
            res.json({ message: 'Data saved to MongoDB' });
        } catch (error) {
            console.error('Error saving data to MongoDB:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.get('/update', verifyToken, async (req, res) => {
    // Check if all required parameters are provided
    const { lastMatchId, discordId } = req.query;
    if (!lastMatchId || !discordId) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const existingUser = await User.find({ discordId }).exec();

    console.log(discordId);
    console.log(lastMatchId);

    if (!existingUser) {
        return res.status(400).json({ error: `User not found!` });
    } else {
        try {
            const newLastMatchId = await getGameCode.makeAPICallWithCode(existingUser.steamId, existingUser.matchAuthId, lastMatchId);
            const matchId = await getMatchId.getMatchId(newLastMatchId);

            console.log(newLastMatchId);
            console.log(matchId);

            // Update user with new match id
            existingUser.lastMatchId = newLastMatchId;
            existingUser.matchId = matchId;
            existingUser.lastMatchUpdate = new Date();
            existingUser.lastMatchDataSend = false;
            await existingUser.save();
            res.json({ message: 'Data updated to MongoDB' });
        } catch (error) {
            console.error('Error saving data to MongoDB:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// router.post('/api-register', async (req, res) => {
//     const { username, password } = req.body;

//     // Hash the user's password before storing it
//     const hashedPassword = await bcrypt.hash(password, 10); // Hashing the password

//     // Create a new user in the database
//     const newAPIUser = new APIUser({ username, password: hashedPassword });

//     // Save the user details to MongoDB
//     newAPIUser.save()
//         .then(savedUser => {
//             res.json({ message: 'User registered successfully' });
//         })
//         .catch(error => {
//             console.error('Error registering user:', error);
//             res.status(500).json({ error: 'Failed to register user' });
//         });
// });

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Find the user in the database by username
    APIUser.findOne({ username })
        .then(async (user) => {
            if (!user) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Compare the provided password with the stored hashed password
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                // Passwords match, generate a JWT token
                const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY, { expiresIn: '365d' });
                res.json({ token });
            } else {
                // Incorrect password
                return res.status(401).json({ error: 'Invalid username or password' });
            }
        })
        .catch(error => {
            console.error('Error logging in:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});

router.get('/match', async (req, res) => {
    // Check if all required parameters are provided
    const { matchId } = req.query;
    if (!matchId) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const foundMatch = await GameData.findById(matchId).exec();
    if (foundMatch) {
        const newMatch = JSON.parse(JSON.stringify(foundMatch));
        const playerDataPromises = newMatch.playerStats.map(getPlayerData);
        Promise.all(playerDataPromises)
            .then((updatedPlayers) => {
                newMatch.playerStats = updatedPlayers.filter((player) => player !== null);
                res.json({ foundMatch: newMatch });
            })
            .catch((error) => {
                console.error('An error occurred:', error);
                res.status(500).json({ error: 'An error occurred' });
            });
    } else {
        return res.status(404).json({ error: 'Game data does not exist' });
    }
});

const getPlayerData = async (player) => {
    try {
        const [data] = await getSteamUserData(player.steamId);
        player.name = data.personaname;
        player.imageUrl = data.avatar;
        return player;
    } catch (error) {
        console.error(`Error fetching data for player ${player.steamId}: ${error}`);
        return player;
    }
};

async function getSteamUserData(steamId) {
    const url = process.env.STEAM_URL + process.env.STEAM_AUTH_KEY + "&format=json&steamids=" + steamId;
    try {
        const response = await axios.get(url);
        return response.data.response.players;
    } catch (error) {
        console.error('Error fetching Steam user data:', error);
        return null;
    }
}

module.exports = router;