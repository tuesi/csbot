const mongoose = require('mongoose');

const apiUserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
});

const APIUser = mongoose.model('ApiUser', apiUserSchema);

module.exports = APIUser;