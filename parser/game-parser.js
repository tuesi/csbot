var { parseEvent, parseHeader, parsePlayerInfo, parseTicks } = require('@laihoe/demoparser2');

const PlayerStat = require('../models/user-game-data');
const MatchDetails = require('../models/match-details');

async function demofileParse(demoPath) {
    try {
        //console.log(demoPath);

        let matchDetails = new MatchDetails();
        let allPlayerStats = [];

        let header = parseHeader(demoPath);
        //console.log(header);
        matchDetails.map = header.map_name;
        console.log(header.map_name);

        let players = parsePlayerInfo(demoPath);

        //let events = listGameEvents(demoPath);
        //console.log(events);

        let other_death = parseEvent(demoPath, "other_death");
        //let scores = parseEvent(demoPath, 'rank_update', ["team_name", "mvps", "player_steamid", "score", "total_cash_spent", "kills_total", "deaths_total", "assists_total", "headshot_kills_total", "damage_total", "utility_damage_total", "enemies_flashed_total", "team_rounds_total", "ace_rounds_total", "4k_rounds_total", "3k_rounds_total"]);
        let flash = parseEvent(demoPath, 'player_blind', ["team_name"], ["is_warmup_period"]);
        let kills = parseEvent(demoPath, "player_death", ["player_steamid", "active_weapon_name", "active_weapon", "item_def_idx", "time", "team_num", "team_name"], ["total_rounds_played", "is_warmup_period", "team_name"]);
        let playerHurtEvents = parseEvent(demoPath, "player_hurt", ["player_steamid", "active_weapon_name", "item_def_idx"], ["total_rounds_played", "is_warmup_period"]);
        //let roundEnd = parseEvent(demoPath, "round_end", ["player_steamid", "time"], ["total_rounds_played", "is_warmup_period", "team_name", "num_player_alive_ct", "num_player_alive_t", "is_rescuing", "round_win_reason", "objective_total"]);
        let playersEachRound = parseEvent(demoPath, "player_spawn", ["player_steamid", "time", "team_num"], ["total_rounds_played", "is_warmup_period", "team_name", "num_player_alive_ct", "num_player_alive_t"]);
        //var hostage = parseEvent(demoPath, "hostage_rescued", ["player_steamid", "time"], ["total_rounds_played", "team_name", "num_player_alive_ct", "num_player_alive_t"]);

        let roundEnd = parseEvent(demoPath, "round_officially_ended", ["player_steamid", "time"], ["total_rounds_played", "is_warmup_period", "team_name", "num_player_alive_ct", "num_player_alive_t", "is_rescuing", "round_win_reason", "objective_total", "round_win_status"]);

        let gameEndTick = Math.max(...parseEvent(demoPath, "round_end").map(x => x.tick))

        let totalRounds = parseTicks(demoPath, ["team_name", "team_rounds_total", "kills_total", "deaths_total", "assists_total", "headshot_kills_total", "ace_rounds_total", "4k_rounds_total", "3k_rounds_total", "damage_total", "utility_damage_total", "enemies_flashed_total", "equipment_value_total", "money_saved_total", "kill_reward_total", "cash_earned_total", "mvps", "total_cash_spent", "score", "total_cash_spent", "rank", "rank_if_win", "rank_if_loss", "rank_if_tie"], [gameEndTick]);

        players.forEach(player => {
            allPlayerStats.push(getDataForPlayer(player.steamid, player.name, player.team_number, other_death, totalRounds, flash, kills, playerHurtEvents, roundEnd, playersEachRound));
        });
        matchDetails.playerStats = allPlayerStats;

        let CT = totalRounds.filter(total => total.team_name == "CT");
        let T = totalRounds.filter(total => total.team_name == "TERRORIST");

        let team1WinAmount = CT[0].team_rounds_total;
        let team2WinAmount = T[0].team_rounds_total;

        matchDetails.team1Score = team1WinAmount;
        matchDetails.team2Score = team2WinAmount;

        header = null;
        players = null;
        other_death = null;
        totalRounds = null;
        flash = null;
        kills = null;
        playerHurtEvents = null;
        roundEnd = null;
        playersEachRound = null;

        return matchDetails;

        //winner 2 = terrorist
        //winer 3 = ct

        //kill.user_steamId = deaths
        //kill.attacker_steamid = kills

        //41 points of damage or more for assist
    } catch (error) {
        console.log(error);
        console.log('parsing error');
    }
}

function getDataForPlayer(steamId, name, team, other_death, totalRounds, flash, kills, playerHurtEvents, roundEnd, playersEachRound) {

    //OTHER _DEATH
    //ADD NO WARMUP
    let other_deathNoWarmUp = other_death.filter(other => other.is_warmup_period == false);
    let chickenKills = other_deathNoWarmUp.filter(event => event.othertype == "chicken" && event.attacker_steamid == steamId);

    //SCORES
    let userScore = totalRounds.filter(total => total.steamid == steamId);

    let CT = totalRounds.filter(total => total.team_name == "CT");
    let T = totalRounds.filter(total => total.team_name == "TERRORIST");

    let CTWinAmount = CT[0].team_rounds_total;
    let TWinAmount = T[0].team_rounds_total;

    let userTeam = userScore[0].team_name;

    let maxRound = Math.max(...kills.map(o => o.total_rounds_played));

    //FLASH
    let flashNoWarmup = flash.filter(fl => fl.is_warmup_period == false);
    let teamFlash = flashNoWarmup.filter(fl => fl.attacker_team_name == fl.user_team_name);
    let userTeamFlash = teamFlash.filter(fl => fl.attacker_steamid == steamId);

    //KILLS
    let killsNoWarmup = kills.filter(fl => fl.is_warmup_period == false && fl.attacker_team_num != fl.user_team_num);
    let deagleKills = killsNoWarmup.filter(kill => kill.attacker_item_def_idx == 1 && kill.headshot == true);
    let userDeagleKills = deagleKills.filter(kill => kill.attacker_steamid == steamId);

    let noScopeAwpKills = killsNoWarmup.filter(kill => kill.weapon == "awp" && kill.noscope == true && kill.attacker_steamid == steamId);

    //is_rescuing round_win_reason objective_total

    //shots_fired

    let pimpesMentele = false;

    for (let round = 0; round <= maxRound; round++) {
        let roundKills = userDeagleKills.filter(kill => kill.total_rounds_played == round);
        if (roundKills.length >= 4) {
            pimpesMentele = true;
        }
    }

    //PLAYERHURTEVENTS
    let playerHurtEventsNoWarmup = playerHurtEvents.filter(fl => fl.is_warmup_period == false && fl.attacker_steamid === steamId);
    let heDmg = playerHurtEventsNoWarmup.filter(e => e.weapon == "hegrenade")
    let molotovDmg = playerHurtEventsNoWarmup.filter(e => (e.weapon == "molotov" || e.weapon == "inferno"));

    let heAllDmg = 0;
    let molotovAllDmg = 0;

    heDmg.forEach(dmg => {
        heAllDmg += dmg.dmg_health;
    });

    molotovDmg.forEach(dmg => {
        molotovAllDmg += dmg.dmg_health;
    });

    let isTie = TWinAmount === CTWinAmount;

    let playerStats = new PlayerStat();

    playerStats.steamId = steamId;
    playerStats.name = name;
    playerStats.mvps = userScore[0].mvps;
    playerStats.kills = userScore[0].kills_total;
    playerStats.deaths = userScore[0].deaths_total;
    playerStats.assists = userScore[0].assists_total;
    playerStats.totalCashSpend = userScore[0].total_cash_spent;
    playerStats.totalDamage = userScore[0].damage_total;
    playerStats.totalUtilityDamage = userScore[0].utility_damage_total;
    playerStats.totalEnemiesFlashed = userScore[0].enemies_flashed_total;
    playerStats.totalHeadshotCount = userScore[0].headshot_kills_total;
    playerStats.totalCurrentMapWins = userScore[0].team_rounds_total;
    playerStats.score = userScore[0].score;
    playerStats.adr = userScore[0].damage_total > 0 ? Math.round(userScore[0].damage_total / maxRound) : 0;
    playerStats.totalAce = userScore[0].ace_rounds_total;
    playerStats.total4kills = userScore[0]['4k_rounds_total'];
    playerStats.total3kills = userScore[0]['3k_rounds_total'];
    if (userScore[0].headshot_kills_total > 0 && userScore[0].kills_total > 0) {
        playerStats.headshotPercentage = Math.round((userScore[0].headshot_kills_total / userScore[0].kills_total) * 100);
    } else {
        playerStats.headshotPercentage = 0;
    }
    playerStats.teamFlash = userTeamFlash.length;
    playerStats.pimpesMentele = pimpesMentele;
    playerStats.team = team;
    playerStats.matchWon = (userTeam == "TERRORIST" && TWinAmount > CTWinAmount || userTeam == "CT" && CTWinAmount > TWinAmount) ? true : false;

    let newRank = userScore[0].rank;
    if (isTie) {
        newRank = userScore[0].rank_if_tie;
    } else {
        newRank = playerStats.matchWon ? userScore[0].rank_if_win ?? 0 : userScore[0].rank_if_loss ?? 0;
    }

    playerStats.rankNew = newRank;
    playerStats.rankOld = userScore[0].rank ?? 0;

    const rankThreshold = 5000;
    const previousRank = Math.floor(playerStats.rankOld / rankThreshold);
    const currentRank = Math.floor(playerStats.rankNew / rankThreshold);

    if (currentRank > previousRank) {
        playerStats.rankChange = 1;
    } else if (currentRank < previousRank) {
        playerStats.rankChange = -1;
    } else {
        playerStats.rankChange = 0;
    }

    playerStats.chickenKills = chickenKills.length;
    playerStats.heDmg = heAllDmg;
    playerStats.molotovDmg = molotovAllDmg;
    playerStats.awpNoScope = noScopeAwpKills.length;


    //HLTV 2.0
    let enemyKills = killsNoWarmup.filter(trade => trade.attacker_team_num != trade.user_team_num && trade.user_team_num == team);
    let playerKills = killsNoWarmup.filter(trade => trade.attacker_team_num != trade.user_team_num && trade.attacker_steamid == steamId);

    //ROUND END

    //OLD ROUND END
    //let roundEndInTeamWin = roundEnd.filter(round => round.winner == team);
    let roundEndInTeamWin = roundEnd.filter(round => round.round_win_status == team);
    //round.attacker_steamid == null to account for cluches where dead by c4

    //TODO Also filter wins where hostage been rescued 
    let playerAliveEvents = killsNoWarmup.filter(round => round.steamid != steamId || round.attacker_steamid == null);

    let allWinningRoundEvents = [];

    roundEndInTeamWin.forEach(winRound => {
        let winRoundEvents = playerAliveEvents.filter(round => round.total_rounds_played == winRound.total_rounds_played);
        allWinningRoundEvents.push(...winRoundEvents);
    });

    //PLAYER SPAWN

    let playerClutchRounds = 0;

    for (let round = 0; round <= maxRound; round++) {
        let currentRound = allWinningRoundEvents.filter(winRound => winRound.total_rounds_played == round);
        if (currentRound.length > 0) {

            //get current player at round start
            const enemyPlayers = new Set();
            const teamPlayers = new Set();

            let currentRound = playersEachRound.filter(winRound => winRound.total_rounds_played == round);
            currentRound.forEach(event => {
                if (event.user_team_num === team) {
                    teamPlayers.add(event.steamid);
                }
                if (event.user_team_num !== team) {
                    enemyPlayers.add(event.steamid);
                }
            });

            //sort round by tick
            currentRound.sort((a, b) => a.tick - b.tick);

            let teamSize = teamPlayers.size
            let enemySize = enemyPlayers.size;

            let playerDead = false;
            let clutch = false;

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




    //HOSTAGE
    //console.log(hostage);
    //console.log(roundEnd);
    //console.log(allWinningRoundEvents);

    // var filterTeamWinRounds = trades.filter(action => {
    //     return roundEndInTeamWin.some(winningRound => winningRound.total_rounds_played === action.total_rounds_played);
    // });

    // var playerDeathRounds = filterTeamWinRounds.filter(round => round.user_steamid == steamId);

    // var winRoundsPlayerAlive = filterTeamWinRounds.filter(action => {
    //     return playerDeathRounds.some(death => death.total_rounds_played != action.total_rounds_played);
    // });

    let roundsCountToKAST = 0;

    let playerTradeCount = 0;
    let playerKillRounds = 0;
    let playerAssistsRounds = 0;
    let multikills = 0;
    let opening_kills = 0;

    let playerTeamKills = killsNoWarmup.filter(trade => trade.attacker_team_num == trade.user_team_num && trade.attacker_steamid == steamId);

    for (let round = 0; round <= maxRound; round++) {

        let kill = false;
        let trade = false;
        let assist = false;
        let survive = false;

        let tradeOccured = enemyKills.some(trade => trade.total_rounds_played === round) &&
            playerKills.some(trade => trade.total_rounds_played === round);
        if (tradeOccured) {
            playerTradeCount++;
            trade = true;
        }

        if (playerKills.some(trade => trade.total_rounds_played === round)) {
            playerKillRounds++;
            kill = true;
        }

        let playerAssists = killsNoWarmup.filter(trade => trade.attacker_team_num != trade.user_team_num && trade.assister_steamid == steamId);

        if (playerAssists.some(trade => trade.total_rounds_played === round)) {
            playerAssistsRounds++;
            assist = true;
        }

        let palyerDeaths = killsNoWarmup.filter(trade => trade.attacker_team_num != trade.user_team_num && trade.user_steamid == steamId);

        if (!palyerDeaths.some(death => death.total_rounds_played === round)) {
            survive = true;
        }

        if (trade == true || kill == true || assist == true || survive == true) {
            roundsCountToKAST++;
        }

        if (playerKills.filter(kill => kill.total_rounds_played === round).length >= 2) {
            multikills++;
        }

        let currentRound = killsNoWarmup.filter(kill => kill.total_rounds_played === round);
        let lowestTickKill = Math.min(...currentRound.map(o => o.tick));

        if (currentRound.filter(kill => kill.tick == lowestTickKill && kill.attacker_steamid == steamId).length > 0) {
            opening_kills++;
        }

    }

    let playerAssitsPerRound = userScore[0].assists_total > 0 ? userScore[0].assists_total / maxRound : 0;

    //console.log("Round KAST: " + roundsCountToKAST);
    //console.log("Max round:" + maxRound);

    let KAST = ((roundsCountToKAST) / maxRound) * 100;

    let KPR = (userScore[0].kills_total / maxRound);
    let DPR = (userScore[0].deaths_total / maxRound);
    //var Impact = (2.13 * KPR) + (0.42 * playerAssitsPerRound) - 0.41;
    let Impact = (0.05 * multikills) + (0.025 * opening_kills) + (0.025 * playerClutchRounds) + (0.0075 * KPR) + (0.0075 * playerAssitsPerRound);
    let ADR = Math.round(userScore[0].damage_total / maxRound);

    let HLTV20 = (0.0073 * KAST) + (0.3591 * KPR) + (-0.5329 * DPR) + (0.2372 * Impact) + (0.0032 * ADR) + 0.1587;

    //console.log("Player HLTV 2.0 Rating: " + name + " : " + HLTV20);

    playerStats.hltv2 = parseFloat(HLTV20.toFixed(2));
    playerStats.multikillRounds = multikills;
    playerStats.openingKills = opening_kills;

    //Add
    //Game type? ar machmaking ar competetive? Ar dabar visur pagal damage vieta skaiciuoja?

    return playerStats;
}

module.exports = { demofileParse };