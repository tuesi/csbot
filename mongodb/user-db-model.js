const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    discordId: String,
    steamId: String,
    matchAuthId: String,
    lastMatchId: String,
    matchId: String,
    firstMatchId: String,
    lastMatchDataSend: Boolean,
    faceitUserId: String,
    lastFaceitMatchId: String,
    lastMatchUpdate: Date
});

const User = mongoose.model('User', userSchema);

module.exports = User;