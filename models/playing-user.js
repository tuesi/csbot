class PlayingUser {
    constructor(steamId, discordId, steamGroupId, map) {
        this.steamId = steamId;
        this.discordId = discordId;
        this.steamGroupId = steamGroupId || 0;
        this.map = map;
    }
}

module.exports = PlayingUser;