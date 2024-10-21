class MatchDetails {
    constructor(playerStats, map, team1Score, team2Score, gameId, dataSource) {
        this.playerStats = playerStats;
        this.map = map || '';
        this.team1Score = team1Score;
        this.team2Score = team2Score;
        this.gameId = gameId;
        this.dataSource = dataSource;
    }
}

module.exports = MatchDetails;
