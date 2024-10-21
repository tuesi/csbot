const axios = require('axios');

async function getFaceitDemoFile(resourceUrl) {
    try {
        console.log('download faceitFile');
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
    try {
        console.log('get match history');
        const machHistoryData = await axios.get(`https://open.faceit.com/data/v4/players/${playerId}/history`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FACEIT_TOKEN}`
            }
        });
        console.log(machHistoryData.data.items[0].match_id);
        return [machHistoryData.data.items[0].match_id, machHistoryData.data.items[0].game_mode];
    } catch (e) {
        console.error(e);
    }
}

async function getMatchData(matchId) {
    try {
        console.log('get match data');
        const matchData = await axios.get(`https://open.faceit.com/data/v4/matches/${matchId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FACEIT_TOKEN}`
            }
        });
        console.log(matchData.data.demo_url[0]);
        return matchData.data.demo_url[0];
    } catch (e) {
        console.log(e);
    }
}

module.exports = { getFaceitDemoFile, getFaceitPlayerId, getPlayerMatchHistory, getMatchData };