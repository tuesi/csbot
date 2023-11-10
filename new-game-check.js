const User = require('./mongodb/user-db-model');
const getGameCode = require('./get-latest-game-code');
const getMatchid = require('./get-match-id');

async function checkIfNewGamesAvailable() {

    const updatedUsers = [];

    try {
        // Find all users in the database
        const users = await User.find({}).exec();

        // Iterate through each user
        for (const user of users) {
            console.log(user.steamId);
            console.log(user.matchAuthId);
            console.log(user.lastMatchId);
            // Perform the getMatch operation on the user's data
            const latestGameCode = await getGameCode.makeAPICallWithCode(user.steamId, user.matchAuthId, user.lastMatchId);
            console.log(latestGameCode);

            // Handle the result (latestGameCode) as needed
            if (latestGameCode !== user.lastMatchId && latestGameCode != null) {
                console.log(latestGameCode);
                console.log(`New game detected for ${user.discordId}`);

                var matchId = await getMatchid.getMatchId(latestGameCode);

                const existingUser = await User.findOne({ matchId });

                // Update the user's lastMatchId in MongoDB
                const updatedUser = await User.findOneAndUpdate(
                    { discordId: user.discordId }, // Find user by discordId
                    {
                        lastMatchId: latestGameCode,
                        matchId: matchId,
                        lastMatchDataSend: false
                    },
                    { new: true }, // To return the updated user document
                );

                if (!existingUser) {
                    updatedUsers.push(updatedUser);
                }
                console.log(`Updated user ${user.discordId}'s lastMatchId`);
            }
        }
        return updatedUsers;
    } catch (error) {
        console.error('Error:', error);
    }
}

module.exports = { checkIfNewGamesAvailable };