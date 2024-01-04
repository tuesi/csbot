const fetch = require('node-fetch');
const VacReport = require('../models/vac-report');
const GameData = require('../mongodb/game-db-model');
const jimmy = require('../jimmy');
const axios = require('axios');

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkForVacBans() {
    console.log("vac check");
    const currectDate = new Date();
    const foundMatch = await GameData.find().exec();
    if (foundMatch.length > 0) {
        for (const match of foundMatch) {
            let daysSinceMatch = 300;
            if (match.gameDate) {
                daysSinceMatch = Math.floor((currectDate - match.gameDate) / (1000 * 60 * 60 * 24));
            }
            let steamIds = [];
            for (const player of match.playerStats) {
                if (player.vac == false) {
                    steamIds.push(player.steamId);
                }
            }
            if (steamIds.length > 0) {
                let url = process.env.VAC_BAN_URL + process.env.STEAM_AUTH_KEY + "&steamids=" + steamIds;
                let vacIds = await checkPlayerBans(url, daysSinceMatch);
                if (vacIds && vacIds.length > 0) {
                    for (const player of match.playerStats) {
                        if (vacIds.includes(player.steamId)) {
                            player.vac = true;
                        }
                    }
                    await match.save();
                    const vacMach = JSON.parse(JSON.stringify(match));
                    vacMach.gameId = match._id;
                    let vacReport = new VacReport(vacMach, vacIds);
                    await jimmy.sendCsVacBanDetails(vacReport);
                }
            }
            await delay(10000);
        }
    }
}

//76561198447475184 ID WITH VAC BAN

async function checkPlayerBans(url, daysSinceMatch) {
    try {
        const response = await axios.get(url);

        if (response.ok) {
            const data = await response.json();
            const vacIds = [];
            if (data && data.players && Array.isArray(data.players)) {
                data.players.forEach(player => {
                    if (player.VACBanned && player.DaysSinceLastBan <= daysSinceMatch) {
                        vacIds.push(player.SteamId);
                    }
                });
            }
            return vacIds;
        } else {
            console.log(response);
            console.log('Failed to get VAC ban data.');
        }
    } catch (error) {
        console.error('Error while fetching VAC ban data:', error);
    }
}

module.exports = { checkForVacBans }