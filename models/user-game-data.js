class PlayerStat {
    constructor(discordId, steamId, name, imageUrl, mvps, kills, deaths, assists, totalCashSpend, totalDamage, totalUtilityDamage, totalEnemiesFlashed, totalHeadshotCount, totalCurrentMapWins, score, adr, matchWon, headshotPercentage,
        teamFlash, totalAce, total4kills, total3kills, pimpesMentele, team, rankNew, rankOld, rankChange, hltv2, multikillRounds, openingKills, heDmg, molotovDmg, awpNoScope) {
        this.discordId = discordId || '';
        this.steamId = steamId || '';
        this.name = name || '';
        this.imageUrl = imageUrl || '';
        this.mvps = mvps || 0;
        this.kills = kills || 0;
        this.deaths = deaths || 0;
        this.assists = assists || 0;
        this.totalCashSpend = totalCashSpend || 0;
        this.totalDamage = totalDamage || 0;
        this.totalUtilityDamage = totalUtilityDamage || 0;
        this.totalEnemiesFlashed = totalEnemiesFlashed || 0;
        this.totalHeadshotCount = totalHeadshotCount || 0;
        this.totalCurrentMapWins = totalCurrentMapWins || 0;
        this.score = score || 0;
        this.adr = adr || 0.0;
        this.totalAce = totalAce || 0;
        this.total4kills = total4kills || 0;
        this.total3kills = total3kills || 0;
        this.headshotPercentage = headshotPercentage || 0;
        this.teamFlash = teamFlash || 0;
        this.pimpesMentele = pimpesMentele || false;
        this.team = team;
        this.matchWon = matchWon || false;
        this.rankNew = rankNew || 0;
        this.rankOld = rankOld || 0;
        this.rankChange = rankChange || 0;
        this.hltv2 = hltv2 || 0;
        this.multikillRounds = multikillRounds || 0;
        this.openingKills = openingKills || 0;
        this.heDmg = heDmg || 0;
        this.molotovDmg = molotovDmg || 0;
        this.awpNoScope = awpNoScope || 0;
    }
}

module.exports = PlayerStat;