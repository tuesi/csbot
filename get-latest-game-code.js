const axios = require('axios');

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to make a new API call with a code
async function makeAPICallWithCode(steamId, authId, matchId) {
    try {
        const response = await axios.get(`https://api.steampowered.com/ICSGOPlayers_730/GetNextMatchSharingCode/v1?key=${process.env.STEAM_AUTH_KEY}&steamid=${steamId}&steamidkey=${authId}&knowncode=${matchId}`);
        const data = response.data;
        console.log(data);
        // Check if there is a "nextcode" in the response

        //{ result: { nextcode: 'n/a' } }
        if (data.result && data.result.nextcode && data.result.nextcode !== "n/a") {
            const nextCode = data.result.nextcode;
            console.log(`Received code: ${nextCode}`);
            // Make a recursive call with the new code
            await delay(500);
            return makeAPICallWithCode(steamId, authId, nextCode);
        } else if (data.status === 412) {
            return null;
        } else {
            console.log('returning' + matchId);
            return matchId;
        }
    } catch (error) {
        console.error('Error making API call with code:', error.message);
        return null;
    }
}

module.exports = { makeAPICallWithCode }