const helper = require('./helper');

const PlayerStat = require('../models/user-game-data');
const MatchDetails = require('../models/match-details');

//USER FRIENDS
//https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=XXX&steamid=XXX&relationship=friend

function defaultDataParser(gameData) {
    let data = gameData[0].roundstatsall;
    let gameInfo = data[[data.length - 1]];
    let playerIds = gameInfo.reservation.account_ids;

    let matchDetails = new MatchDetails();
    matchDetails.team1Score = gameInfo.team_scores[0];
    matchDetails.team2Score = gameInfo.team_scores[1];
    let allPlayerStats = [];

    for (let i = 0; i < playerIds.length; i++) {
        let playerStats = new PlayerStat();
        playerStats.steamId = helper.ToSteamID(playerIds[i]);
        playerStats.kills = gameInfo.kills[i];
        playerStats.deaths = gameInfo.deaths[i];
        playerStats.assists = gameInfo.assists[i];
        playerStats.totalHeadshotCount = gameInfo.enemy_headshots[i];
        playerStats.mvps = gameInfo.mvps[i];
        playerStats.score = gameInfo.scores[i];
        if (gameInfo.enemy_headshots[i] > 0 && gameInfo.kills[i] > 0) {
            playerStats.headshotPercentage = Math.round((gameInfo.enemy_headshots[i] / gameInfo.kills[i]) * 100);
        } else {
            playerStats.headshotPercentage = 0;
        }

        playerStats.team = i <= 4 ? 3 : 2;

        if (i <= 4 && gameInfo.team_scores[0] > gameInfo.team_scores[1]) {
            playerStats.matchWon = true;
        } else if (i >= 5 && gameInfo.team_scores[1] > gameInfo.team_scores[0]) {
            playerStats.matchWon = true;
        } else {
            playerStats.matchWon = false;
        }
        allPlayerStats.push(playerStats);
    }
    matchDetails.playerStats = allPlayerStats;
    return matchDetails;
}

module.exports = { defaultDataParser };