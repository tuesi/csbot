const express = require('express');
const router = express.Router();
const User = require('./mongodb/user-db-model');
const APIUser = require('./mongodb/api-user-model');
const getGameCode = require('./get-latest-game-code');
const getMatchId = require('./get-match-id');
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
            var lastMatchDataSend = false;

            // Create a new user document and save it to the database
            const newUser = new User({
                discordId,
                steamId,
                matchAuthId,
                lastMatchId: newLastMatchId,
                matchId,
                firstMatchId: lastMatchId,
                lastMatchDataSend
            });

            await newUser.save();
            res.json({ message: 'Data saved to MongoDB' });
        } catch (error) {
            console.error('Error saving data to MongoDB:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.post('/api-register', async (req, res) => {
    const { username, password } = req.body;

    // Hash the user's password before storing it
    const hashedPassword = await bcrypt.hash(password, 10); // Hashing the password

    // Create a new user in the database
    const newAPIUser = new APIUser({ username, password: hashedPassword });

    // Save the user details to MongoDB
    newAPIUser.save()
        .then(savedUser => {
            res.json({ message: 'User registered successfully' });
        })
        .catch(error => {
            console.error('Error registering user:', error);
            res.status(500).json({ error: 'Failed to register user' });
        });
});

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

module.exports = router;