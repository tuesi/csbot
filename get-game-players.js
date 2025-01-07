const User = require('./mongodb/user-db-model');

async function getGamePlayers(matchId, data) {

    const steamIds = data.playerStats.map(player => player.steamId);

    // Query the database for users with steamId in the list
    const users = await User.find({ steamId: { $in: steamIds } }).exec();

    const matchIdUser = users.find(user => user.matchId === matchId);

    if (matchIdUser) {
        for (const user of users) {
            user.lastMatchDataSend = false;
            user.lastMatchId = matchIdUser.lastMatchId;
            user.matchId = matchIdUser.matchId;
            await user.save();
        }
    }
}

module.exports = { getGamePlayers }