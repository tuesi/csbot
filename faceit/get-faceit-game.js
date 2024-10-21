const axios = require('axios');

async function getFaceitDemoFile(resourceUrl) {
    try {
        const demoFileResponse = await axios.post("https://open.faceit.com/download/v2/demos/download", { resource_url: resourceUrl }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FACEIT_TOKEN}`
            }
        });
        return demoFileResponse.data.payload.download_url;
    } catch (e) {
        console.error(e);
    }
}

async function getFaceitPlayerId(nickname) {
    const playerDataResponse = await axios.get(`https://open.faceit.com/data/v4/players?nickname=${nickname}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.FACEIT_TOKEN}`
        }
    });
    return playerDataResponse.data.player_id;
}

async function getPlayerMatchHistory(playerId) {
    const machHistoryData = await axios.get(`https://open.faceit.com/data/v4/players/${playerId}/history`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.FACEIT_TOKEN}`
        }
    });
    return [machHistoryData.data.items[0].match_id, machHistoryData.data.items[0].game_mode];
}

async function getMatchData(matchId) {
    const matchData = await axios.get(`https://open.faceit.com/data/v4/matches/${matchId}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.FACEIT_TOKEN}`
        }
    });
    return matchData.data.demo_url[0];
}

module.exports = { getFaceitDemoFile, getFaceitPlayerId, getPlayerMatchHistory, getMatchData };