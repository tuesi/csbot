const User = require('./mongodb/user-db-model');
const GameData = require('./mongodb/game-db-model');

const jimmyApi = require('./jimmy');

async function send(matchId, data) {
    try {
        const users = await User.find({ matchId: matchId, lastMatchDataSend: false }).exec();
        //const users = await User.find().exec();
        let lastMatchId = null;
        if (users.length > 0) {
            lastMatchId = users[0].lastMatchId;
        }
        for (const user of users) {
            // Update lastMatchDataSend to true
            user.lastMatchDataSend = true;
            user.lastMatchUpdate = new Date();
            await user.save(); // Save the updated user document

            //console.log(data.playerStats);
            // Find and update the corresponding user in data.playerStats
            const playerStatIndex = data.playerStats.findIndex(player => player.steamId === user.steamId);
            if (playerStatIndex !== -1) {
                data.playerStats[playerStatIndex].discordId = user.discordId; // Update discordId
            }
        }

        const gameId = await saveGameData(data, lastMatchId);

        data.gameId = gameId.toString();
        data.dataSource = 'VALVE';

        await jimmyApi.sendCsMatchDetails(data);

        data = null;
        return true;
    } catch (err) {
        console.error('Error sending data:', err);
        return true;
    }
}

async function sendFaceitGame(matchId, data) {
    try {
        const users = await User.find({ lastFaceitMatchId: matchId, lastMatchDataSend: false }).exec();
        //const users = await User.find().exec();
        let lastMatchId = null;
        if (users.length > 0) {
            lastMatchId = users[0].lastFaceitMatchId;
        }
        for (const user of users) {
            // Update lastMatchDataSend to true
            user.lastMatchDataSend = true;
            user.lastMatchUpdate = new Date();
            await user.save(); // Save the updated user document

            //console.log(data.playerStats);
            // Find and update the corresponding user in data.playerStats
            const playerStatIndex = data.playerStats.findIndex(player => player.steamId === user.steamId);
            if (playerStatIndex !== -1) {
                data.playerStats[playerStatIndex].discordId = user.discordId; // Update discordId
            }
        }

        const gameId = await saveGameData(data, lastMatchId);

        data.gameId = gameId.toString();
        data.dataSource = 'FACEIT';

        await jimmyApi.sendCsMatchDetails(data);

        data = null;
        return true;
    } catch (err) {
        console.error('Error sending data:', err);
        return true;
    }
}

async function saveGameData(data, matchId) {
    const game = await GameData.find({ matchId: matchId }).exec();
    if (game.length == 0) {
        console.log('new game saving');
        data.gameDate = new Date();
        data.matchId = matchId;
        const gameData = new GameData(data);
        try {
            const savedData = await gameData.save();
            return savedData._id;
        } catch (error) {
            console.log(error);
            console.log("error saving game data");
        }
    } else {
        return game[0]._id;
    }

    //FOR TESTING
    // console.log('new game saving');
    // data.gameDate = new Date();
    // data.matchId = matchId;
    // const gameData = new GameData(data);
    // try {
    //     const savedData = await gameData.save();
    //     return savedData._id;
    // } catch (error) {
    //     console.log(error);
    //     console.log("error saving game data");
    // }
}

module.exports = { send, sendFaceitGame }