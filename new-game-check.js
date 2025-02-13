const User = require('./mongodb/user-db-model');
const getGameCode = require('./get-latest-game-code');
const getMatchid = require('./get-match-id');
const faceitDemo = require('./faceit/get-faceit-game');

async function checkIfNewGamesAvailable() {

    let updatedUsers = [];

    try {
        // Find all users in the database
        //let users = await User.find({}).exec();

        //Find only users that last match id update date is less than a month
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        let users = await User.find({
            lastMatchUpdate: { $gte: oneMonthAgo }
        }).exec();

        // Iterate through each user
        for (const user of users) {
            // Perform the getMatch operation on the user's data
            const latestGameCode = await getGameCode.makeAPICallWithCode(user.steamId, user.matchAuthId, user.lastMatchId);

            // Handle the result (latestGameCode) as needed
            if (latestGameCode != null && latestGameCode !== user.lastMatchId) {
                console.log(`New game detected for ${user.discordId}`);

                let matchId = await getMatchid.getMatchId(latestGameCode);

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
                    console.log("Adding unique match user to queue");
                    updatedUsers.push(updatedUser);
                }
                console.log(`Updated user ${user.discordId}'s lastMatchId`);
            }
        }
        users = null;
        return updatedUsers;
    } catch (error) {
        console.error('Error:', error);
    }
}

async function checkIfNewFaceitGamesAvailable() {
    let updatedUsers = [];

    try {
        // Find all users in the database
        let users = await User.find({}).exec();

        //Find only users that last match id update date is less than a month
        // const oneMonthAgo = new Date();
        // oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // let users = await User.find({
        //     lastMatchUpdate: { $gte: oneMonthAgo }
        // }).exec();

        // Iterate through each user
        for (const user of users) {
            if (!user.faceitUserId) {
                continue;
            }
            // Perform the getMatch operation on the user's data
            const latestMatchId = await faceitDemo.getPlayerMatchHistory(user.faceitUserId);

            // Handle the result (latestGameCode) as needed
            if (latestMatchId && latestMatchId[0] != null && latestMatchId[0] !== user.lastFaceitMatchId) {
                console.log(`New game detected for ${user.discordId}`);

                const matchId = latestMatchId[0];

                const existingUser = await User.findOne({ matchId });

                // Update the user's lastMatchId in MongoDB
                const updatedUser = await User.findOneAndUpdate(
                    { discordId: user.discordId }, // Find user by discordId
                    {
                        lastFaceitMatchId: matchId,
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
        users = null;
        return updatedUsers;
    } catch (error) {
        console.error('Error:', error);
    }
}

module.exports = { checkIfNewGamesAvailable, checkIfNewFaceitGamesAvailable };