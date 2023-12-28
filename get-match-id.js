const cs = require("csgo");

function getMatchId(latestMatchId) {
    let decoder = new cs.SharecodeDecoder(latestMatchId);
    let decoded = decoder.decode();
    return decoded.matchId;
}

module.exports = { getMatchId }