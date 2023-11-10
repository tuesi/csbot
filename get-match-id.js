const cs = require("csgo");

function getMatchId(latestMatchId) {
    console.log(latestMatchId);
    var decoder = new cs.SharecodeDecoder(latestMatchId);
    var decoded = decoder.decode();
    return decoded.matchId;
}

module.exports = { getMatchId }