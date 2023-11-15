const mongoose = require('mongoose');

const gameDataSchema = new mongoose.Schema({
    map: String,
    team1Score: Number,
    team2Score: Number,
    gameDate: Date,
    matchId: String,
    playerStats: [
        {
            vac: { type: Boolean, default: false },
            discordId: String,
            steamId: String,
            name: String,
            mvps: Number,
            kills: Number,
            deaths: Number,
            assists: Number,
            totalCashSpend: Number,
            totalDamage: Number,
            totalUtilityDamage: Number,
            totalEnemiesFlashed: Number,
            totalHeadshotCount: Number,
            totalCurrentMapWins: Number,
            cashSpent: Number,
            score: Number,
            adr: Number,
            totalAce: Number,
            total4kills: Number,
            total3kills: Number,
            headshotPercentage: Number,
            teamFlash: Number,
            pimpesMentele: Boolean,
            team: Number,
            matchWon: Boolean,
            rankNew: Number,
            rankOld: Number,
            rankChange: Number,
            hltv2: String,
            multikillRounds: Number,
            openingKills: Number,
            heDmg: Number,
            molotovDmg: Number,
            awpNoScope: Number
        }
    ]
});

const GameData = mongoose.model('GameData', gameDataSchema);

module.exports = GameData;