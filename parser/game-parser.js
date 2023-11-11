var { parseEvent, parseTicks, parseHeader, parsePlayerInfo, listGameEvents, parseEvents } = require('@laihoe/demoparser2');
const fs = require('fs');

const PlayerStat = require('../models/user-game-data');
const MatchDetails = require('../models/match-details');

async function demofileParse(demoPath) {
    console.log(demoPath);

    //let kills = parseEvent(demoPath, "player_death", ["last_place_name", "team_name"], ["total_rounds_played", "is_warmup_period"])


    // Here we could add more filters like weapons and zones etc.
    // remove team-kills and warmup kills
    //let killsNoWarmup = kills.filter(kill => kill.is_warmup_period == false)
    //let filteredKills = killsNoWarmup.filter(kill => kill.attacker_team_name != kill.user_team_name)
    //let maxRound = Math.max(...kills.map(o => o.total_rounds_played))


    // for (let round = 0; round <= maxRound; round++) {
    //     const killsPerPlayer = {};
    //     let killsThisRound = filteredKills.filter(kill => kill.total_rounds_played == round)
    //     killsThisRound.forEach(item => {
    //         const attackerName = item.attacker_name;
    //         const kills = killsPerPlayer[attackerName] || 0;
    //         killsPerPlayer[attackerName] = kills + 1;
    //     });
    //console.log("round:", round)
    //console.log(killsPerPlayer)
    //}
    // let event_json = parseEvent(demoPath, "player_death", ["X", "Y"], ["total_rounds_played"]);
    // let test = parseHeader(demoPath);
    //let ticks_json = parseTicks("test.dem", ["X", "Y"]);
    //let demoInfo = parsePlayerInfo(demoPath);

    // let playerDeaths = parseEvent(demoPath, 'player_death', ["last_place_name", "team_name", "player_steamid"], ["total_rounds_played", "is_warmup_period"]);
    // let playerAssits = parseEvent(demoPath, 'player_hurt', ["last_place_name", "team_name", "player_steamid", "score", "mvps"], ["total_rounds_played", "is_warmup_period"]);
    // let killsNoWarmup = playerAssits.filter(kill => kill.is_warmup_period == false);
    // let filteredKills = killsNoWarmup.filter(kill => kill.attacker_steamid == '76561198159334860');

    //console.log(forAssist);

    // let assists = parseEvent(demoPath, 'player_death', ["last_place_name", "team_name", "player_steamid"], ["total_rounds_played", "is_warmup_period"]);
    // let assistsNoWarmup = assists.filter(kill => kill.is_warmup_period == false);
    // let userAssists = assistsNoWarmup.filter(kill => kill.assister_steamid == '76561198159334860');

    // console.log("Assists: " + userAssists.length);

    // let kills = parseEvent(demoPath, 'player_death', ["last_place_name", "team_name", "player_steamid"], ["total_rounds_played", "is_warmup_period"]);
    // let killsNoWarmup = kills.filter(kill => kill.is_warmup_period == false);
    // let userKills = killsNoWarmup.filter(kill => kill.attacker_steamid == '76561198159334860');

    // console.log("Kills: " + userKills.length);

    // let deaths = parseEvent(demoPath, 'player_death', ["last_place_name", "team_name", "player_steamid"], ["total_rounds_played", "is_warmup_period"]);
    // let deathsNoWarmup = deaths.filter(kill => kill.is_warmup_period == false);
    // let userDeaths = deathsNoWarmup.filter(kill => kill.user_steamid == '76561198159334860');

    // console.log("Deaths: " + userDeaths.length);

    var matchDetails = new MatchDetails();
    let allPlayerStats = [];

    let header = parseHeader(demoPath);
    console.log(header);
    matchDetails.map = header.map_name;
    console.log(header.map_name);

    let players = parsePlayerInfo(demoPath);

    let events = listGameEvents(demoPath);
    console.log(events);

    players.forEach(player => {
        allPlayerStats.push(getDataForPlayer(demoPath, player.steamid, player.name, player.team_number));
    });
    matchDetails.playerStats = allPlayerStats;

    let scores = parseEvent(demoPath, 'rank_update', ["team_name", "team_rounds_total"]);

    console.log(scores);

    let CT = scores.filter(score => score.user_team_name == "CT");
    let T = scores.filter(score => score.user_team_name == "TERRORIST");

    let team1WinAmount = CT[0].user_team_rounds_total;
    let team2WinAmount = T[0].user_team_rounds_total;

    matchDetails.team1Score = team1WinAmount;
    matchDetails.team2Score = team2WinAmount;

    //console.log(matchDetails);

    return matchDetails;



    //console.log(scores);

    // let endRound = parseEvent(demoPath, 'round_end', ["last_place_name", "team_name", "player_steamid", "score"], ["total_rounds_played", "is_warmup_period", "team_rounds_total"]);
    // let tWin = endRound.filter(round => round.winner == 2);
    // let ctWin = endRound.filter(round => round.winner == 3);
    // console.log("T won: " + tWin.length + " rounds");
    // console.log("CS won: " + ctWin.length + " rounds");

    //winner 2 = terrorist
    //winer 3 = ct

    //kill.user_steamId = deaths
    //kill.attacker_steamid = kills

    //41 points of damage or more for assist


    let demo = parseHeader(demoPath);
    let gameEvents = listGameEvents(demoPath);
    //console.log(totalAssists);
    // console.log(score);
    //console.log(ticks_json);
    return demo;
}

function getDataForPlayer(demoPath, steamId, name, team) {

    //console.log(name);

    let mvps = parseEvent(demoPath, 'round_mvp', ["player_steamid"], ["total_rounds_played"]);
    let allMvps = mvps.filter(mvp => mvp.user_steamid == steamId);

    let scores = parseEvent(demoPath, 'rank_update', ["team_name", "player_steamid", "score", "total_cash_spent", "kills_total", "deaths_total", "assists_total", "headshot_kills_total", "damage_total", "utility_damage_total", "enemies_flashed_total", "team_rounds_total", "ace_rounds_total", "4k_rounds_total", "3k_rounds_total"]);
    let userScore = scores.filter(score => score.user_steamid == steamId);
    let CT = scores.filter(score => score.user_team_name == "CT");
    let T = scores.filter(score => score.user_team_name == "TERRORIST");

    let CTWinAmount = CT[0].user_team_rounds_total;
    let TWinAmount = T[0].user_team_rounds_total;

    let userTeam = userScore[0].user_team_name;

    let maxRound = Math.max(...mvps.map(o => o.total_rounds_played))

    let flash = parseEvent(demoPath, 'player_blind', ["team_name"], ["is_warmup_period"]);
    let flashNoWarmup = flash.filter(fl => fl.is_warmup_period == false);
    let teamFlash = flashNoWarmup.filter(fl => fl.attacker_team_name == fl.user_team_name);
    let userTeamFlash = teamFlash.filter(fl => fl.attacker_steamid == steamId);

    let kills = parseEvent(demoPath, "player_death", ["player_steamid", "active_weapon_name", "item_def_idx"], ["total_rounds_played", "is_warmup_period"]);
    let deagleKills = kills.filter(kill => kill.attacker_item_def_idx == 1 && kill.headshot == true);
    let userDeagleKills = deagleKills.filter(kill => kill.attacker_steamid == steamId);

    var pimpesMentele = false;

    for (let round = 0; round <= maxRound; round++) {
        var roundKills = userDeagleKills.filter(kill => kill.total_rounds_played == round);
        if (roundKills.length >= 4) {
            console.log(roundKills);
            pimpesMentele = true;
        }
    }

    var playerStats = new PlayerStat();

    playerStats.steamId = steamId;
    playerStats.name = name;
    playerStats.mvps = allMvps.length;
    playerStats.kills = userScore[0].user_kills_total;
    playerStats.deaths = userScore[0].user_deaths_total;
    playerStats.assists = userScore[0].user_assists_total;
    playerStats.totalCashSpend = userScore[0].user_total_cash_spent;
    playerStats.totalDamage = userScore[0].user_damage_total;
    playerStats.totalUtilityDamage = userScore[0].user_utility_damage_total;
    playerStats.totalEnemiesFlashed = userScore[0].user_enemies_flashed_total;
    playerStats.totalHeadshotCount = userScore[0].user_headshot_kills_total;
    playerStats.totalCurrentMapWins = userScore[0].num_wins;
    playerStats.cashSpent = userScore[0].user_total_cash_spent;
    playerStats.score = userScore[0].user_score;
    playerStats.adr = Math.round(userScore[0].user_damage_total / maxRound);
    playerStats.totalAce = userScore[0].user_ace_rounds_total;
    playerStats.total4kills = userScore[0].user_4k_rounds_total;
    playerStats.total3kills = userScore[0].user_3k_rounds_total;
    playerStats.headshotPercentage = Math.round((userScore[0].user_headshot_kills_total / userScore[0].user_kills_total) * 100);
    playerStats.teamFlash = userTeamFlash.length;
    playerStats.pimpesMentele = pimpesMentele;
    playerStats.team = team;
    playerStats.matchWon = (userTeam == "TERRORIST" && TWinAmount > CTWinAmount || userTeam == "CT" && CTWinAmount > TWinAmount) ? true : false;


    //HLTV 2.0

    var trades = parseEvent(demoPath, "player_death", ["player_steamid", "time", "team_num"], ["total_rounds_played", "is_warmup_period", "team_name"]);
    var tradesNoWarmup = trades.filter(trade => trade.is_warmup_period == false);
    var enemyKills = tradesNoWarmup.filter(trade => trade.attacker_team_num != trade.user_team_num && trade.user_team_num == team);
    var playerKills = tradesNoWarmup.filter(trade => trade.attacker_team_num != trade.user_team_num && trade.attacker_steamid == steamId);

    //console.log(trades);

    var roundEnd = parseEvent(demoPath, "round_end", ["player_steamid", "time"], ["total_rounds_played", "is_warmup_period", "team_name", "num_player_alive_ct", "num_player_alive_t"]);

    //console.log(roundEnd);

    var roundEndInTeamWin = roundEnd.filter(round => round.winner == team);
    //round.attacker_steamid == null to account for cluches where dead by c4

    //TODO Also filter wins where hostage been rescued 
    var playerAliveEvents = trades.filter(round => round.user_steamid != steamId || round.attacker_steamid == null);

    var allWinningRoundEvents = [];

    roundEndInTeamWin.forEach(winRound => {
        var winRoundEvents = playerAliveEvents.filter(round => round.total_rounds_played == winRound.total_rounds_played);
        allWinningRoundEvents.push(...winRoundEvents);
    });

    //console.log(allWinningRoundEvents);

    //TODO maybe get player cound by getting player_hurt event?

    var playersEachRound = parseEvent(demoPath, "player_spawn", ["player_steamid", "time", "team_num"], ["total_rounds_played", "is_warmup_period", "team_name", "num_player_alive_ct", "num_player_alive_t"]);

    // for (let round = 0; round <= maxRound; round++) {
    //     console.log("ROUND: " + round);
    //     const enemyPlayers = new Set();
    //     const teamPlayers = new Set();
    //     //get player count each round
    //     var currentRound = playersEachRound.filter(winRound => winRound.total_rounds_played == round);
    //     currentRound.forEach(event => {
    //         if (event.user_team_num === team) {
    //             teamPlayers.add(event.user_steamid);
    //         }
    //         if (event.user_team_num !== team) {
    //             enemyPlayers.add(event.user_steamid);
    //         }
    //     });
    //     console.log(teamPlayers.size);
    //     console.log(enemyPlayers.size);
    // }

    var playerClutchRounds = 0;

    for (let round = 0; round <= maxRound; round++) {
        var currentRound = allWinningRoundEvents.filter(winRound => winRound.total_rounds_played == round);
        if (currentRound.length > 0) {

            //get current player at round start
            const enemyPlayers = new Set();
            const teamPlayers = new Set();

            var currentRound = playersEachRound.filter(winRound => winRound.total_rounds_played == round);
            currentRound.forEach(event => {
                if (event.user_team_num === team) {
                    teamPlayers.add(event.user_steamid);
                }
                if (event.user_team_num !== team) {
                    enemyPlayers.add(event.user_steamid);
                }
            });

            //sort round by tick
            currentRound.sort((a, b) => a.tick - b.tick);

            var teamSize = teamPlayers.size
            var enemySize = enemyPlayers.size;

            var playerDead = false;
            var clutch = false;

            //check if user cluch
            currentRound.forEach(event => {
                if (event.user_team_num == team) {
                    teamSize--;
                }
                if (event.user_team_num != team) {
                    enemySize--;
                }

                if (event.user_steamid == steamId) {
                    playerDead = true;
                }

                if (playerDead == false && teamSize == 1 && enemySize > 0) {
                    clutch = true;
                }
            });

            if (clutch == true) {
                playerClutchRounds++;
            }
        }
    }




    //var test = parseEvent(demoPath, "hostage_rescued", ["player_steamid", "time"], ["total_rounds_played", "is_warmup_period", "team_name", "num_player_alive_ct", "num_player_alive_t"]);
    //console.log(test);
    //console.log(allWinningRoundEvents);

    // var filterTeamWinRounds = trades.filter(action => {
    //     return roundEndInTeamWin.some(winningRound => winningRound.total_rounds_played === action.total_rounds_played);
    // });

    // var playerDeathRounds = filterTeamWinRounds.filter(round => round.user_steamid == steamId);

    // var winRoundsPlayerAlive = filterTeamWinRounds.filter(action => {
    //     return playerDeathRounds.some(death => death.total_rounds_played != action.total_rounds_played);
    // });

    var roundsCountToKAST = 0;

    var playerTradeCount = 0;
    var playerKillRounds = 0;
    var playerAssistsRounds = 0;
    var multikills = 0;
    var opening_kills = 0;

    var playerTeamKills = tradesNoWarmup.filter(trade => trade.attacker_team_num == trade.user_team_num && trade.attacker_steamid == steamId);

    for (let round = 0; round <= maxRound; round++) {

        var kill = false;
        var trade = false;
        var assist = false;
        var survive = false;

        var tradeOccured = enemyKills.some(trade => trade.total_rounds_played === round) &&
            playerKills.some(trade => trade.total_rounds_played === round);
        if (tradeOccured) {
            playerTradeCount++;
            trade = true;
        }

        if (playerKills.some(trade => trade.total_rounds_played === round)) {
            playerKillRounds++;
            kill = true;
        }

        var playerAssists = tradesNoWarmup.filter(trade => trade.attacker_team_num != trade.user_team_num && trade.assister_steamid == steamId);

        if (playerAssists.some(trade => trade.total_rounds_played === round)) {
            playerAssistsRounds++;
            assist = true;
        }

        var palyerDeaths = tradesNoWarmup.filter(trade => trade.attacker_team_num != trade.user_team_num && trade.user_steamid == steamId);

        if (!palyerDeaths.some(death => death.total_rounds_played === round)) {
            survive = true;
        }

        if (trade == true || kill == true || assist == true || survive == true) {
            roundsCountToKAST++;
        }

        if (playerKills.filter(kill => kill.total_rounds_played === round).length >= 2) {
            multikills++;
        }

        var currentRound = trades.filter(kill => kill.total_rounds_played === round);
        let lowestTickKill = Math.min(...currentRound.map(o => o.tick));

        if (currentRound.filter(kill => kill.tick == lowestTickKill && kill.attacker_steamid == steamId).length > 0) {
            opening_kills++;
        }

    }

    var playerAssitsPerRound = userScore[0].user_assists_total / maxRound;

    console.log("Round KAST: " + roundsCountToKAST);
    console.log("Max round:" + maxRound);

    var KAST = ((roundsCountToKAST) / maxRound) * 100;

    var KPR = (userScore[0].user_kills_total / maxRound);
    var DPR = (userScore[0].user_deaths_total / maxRound);
    //var Impact = (2.13 * KPR) + (0.42 * playerAssitsPerRound) - 0.41;
    var Impact = (0.05 * multikills) + (0.025 * opening_kills) + (0.025 * playerClutchRounds) + (0.0075 * KPR) + (0.0075 * playerAssitsPerRound);
    var ADR = Math.round(userScore[0].user_damage_total / maxRound);

    var HLTV20 = (0.0073 * KAST) + (0.3591 * KPR) + (-0.5329 * DPR) + (0.2372 * Impact) + (0.0032 * ADR) + 0.1587;

    console.log("Player HLTV 2.0 Rating: " + name + " : " + HLTV20);


    //Add
    //Game type? ar machmaking ar competetive? Ar dabar visur pagal damage vieta skaiciuoja?

    return playerStats;

    console.log("Kills: " + userScore[0].user_kills_total);
    console.log("Deaths: " + userScore[0].user_deaths_total);
    console.log("Assists: " + userScore[0].user_assists_total);
    console.log("Total cash spend: " + userScore[0].user_total_cash_spent);
    console.log("Total damage: " + userScore[0].user_damage_total);
    console.log("Total utility damage: " + userScore[0].user_utility_damage_total);
    console.log("Total enemies flashed: " + userScore[0].user_enemies_flashed_total);
    console.log("Total headshot count: " + userScore[0].user_headshot_kills_total);
    console.log("Number of total current map wins: " + userScore[0].num_wins);
    console.log("Cash spent: " + userScore[0].user_total_cash_spent);
    console.log("Score: " + userScore[0].user_score);
    console.log("ADR: " + Math.round(userScore[0].user_damage_total / maxRound));
    console.log((userTeam == "TERRORIST" && TWinAmount > CTWinAmount || userTeam == "CT" && CTWinAmount > TWinAmount) ? "Match win result " + CTWinAmount + ":" + TWinAmount : "Match lost result " + CTWinAmount + ":" + TWinAmount);

}

module.exports = { demofileParse };