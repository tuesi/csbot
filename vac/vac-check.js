const fetch = require('node-fetch');
const VacReport = require('../models/vac-report');
const GameData = require('../mongodb/game-db-model');
const jimmy = require('../jimmy');

async function checkForVacBans() {
    const foundMatch = await GameData.find().exec();
    if (foundMatch.length > 0) {
        foundMatch.forEach(async match => {
            var steamIds = [];
            match.playerStats.forEach(async player => {
                if (player.vac == false) {
                    steamIds.push(player.steamId);
                }
            });
            if (steamIds.length > 0) {
                var url = process.env.VAC_BAN_URL + process.env.STEAM_AUTH_KEY + "&steamids=" + steamIds;
                var vacIds = await checkPlayerBans(url);
                if (vacIds.length > 0) {
                    for (const player of match.playerStats) {
                        if (vacIds.includes(player.steamId)) {
                            player.vac = true;
                        }
                    }
                    await match.save();
                    var vacReport = new VacReport(match, vacIds);
                    console.log(vacReport);
                    await jimmy.sendCsVacBanDetails(vacReport);
                }
            }
        });
    }
}

//76561198447475184 ID WITH VAC BAN

async function checkPlayerBans(url) {
    try {
        const response = await fetch(url, {
            method: 'GET'
        });

        if (response.ok) {
            const data = await response.json();
            const vacIds = [];
            if (data && data.players && Array.isArray(data.players)) {
                data.players.forEach(player => {
                    if (player.VACBanned) {
                        vacIds.push(player.SteamId);
                    }
                });
            }
            return vacIds;
        } else {
            console.log('Failed to get VAC ban data.');
        }
    } catch (error) {
        console.error('Error while fetching VAC ban data:', error);
    }
}

module.exports = { checkForVacBans }