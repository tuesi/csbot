const cs = require("csgo");

function getMatchId(latestMatchId) {
    var decoder = new cs.SharecodeDecoder(latestMatchId);
    var decoded = decoder.decode();
    return decoded.matchId;
}

module.exports = { getMatchId }