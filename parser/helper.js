bignumber = require("bignumber.js")

function ToAccountID(accid) {
    return new bignumber(accid).minus('76561197960265728') - 0;
};

function ToSteamID(accid) {
    return new bignumber(accid).plus('76561197960265728') + "";
};

module.exports = { ToAccountID, ToSteamID }