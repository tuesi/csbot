const User = require('./mongodb/user-db-model');
const GameData = require('./mongodb/game-db-model');
const fs = require('fs');

const jimmyApi = require('./jimmy');

async function send(matchId, data) {
    const users = await User.find({ matchId: matchId, lastMatchDataSend: false }).exec();
    //const users = await User.find().exec();
    var lastMatchId = null;
    if (users.length > 0) {
        lastMatchId = users[0].lastMatchId;
    }
    for (const user of users) {
        // Update lastMatchDataSend to true
        user.lastMatchDataSend = true;
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
    console.log(data);

    await jimmyApi.sendCsMatchDetails(data);

    //console.log(data);

    //UNCOMMENT TO DELETE OLD FILE

    var filePath = `currentDemo${matchId}.dem`;

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error('File does not exist:', err);
            return;
        }

        // File exists, so delete it
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return;
            }

            console.log('File deleted successfully');
        });
    });
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
}

module.exports = { send }