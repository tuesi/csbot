class MatchDetails {
    constructor(playerStats, map, team1Score, team2Score, gameId) {
        this.playerStats = playerStats;
        this.map = map;
        this.team1Score = team1Score;
        this.team2Score = team2Score;
        this.gameId = gameId;
    }
}

module.exports = MatchDetails;
