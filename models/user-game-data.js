class PlayerStat {
    constructor(discordId, steamId, name, mvps, kills, deaths, assists, totalCashSpend, totalDamage, totalUtilityDamage, totalEnemiesFlashed, totalHeadshotCount, totalCurrentMapWins, cashSpent, score, adr, matchWon, headshotPercentage, teamFlash, totalAce, total4kills, total3kills, pimpesMentele, team) {
        this.discordId = discordId || '';
        this.steamId = steamId || '';
        this.name = name || '';
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
        this.cashSpent = cashSpent || 0;
        this.score = score || 0;
        this.adr = adr || 0.0;
        this.totalAce = totalAce;
        this.total4kills = total4kills;
        this.total3kills = total3kills;
        this.headshotPercentage = headshotPercentage || 0;
        this.teamFlash = teamFlash || 0;
        this.pimpesMentele = pimpesMentele || false;
        this.team = team;
        this.matchWon = matchWon || false;
    }
}

module.exports = PlayerStat;