const SteamUser = require('steam-user');
const GlobalOffensive = require('globaloffensive');
const SteamCommunity = require('steamcommunity');
const axios = require('axios');
const bignumber = require("bignumber.js");
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const cron = require('node-cron');
const cors = require('cors');
require('dotenv').config();

const newGameCheck = require('./new-game-check');
const gameFileGetter = require('./game-file-getter');
const gameParser = require('./parser/game-parser');
const sendGameData = require('./send-game-data');

const vacReport = require('./vac/vac-check');

let user = new SteamUser();
const community = new SteamCommunity();
let csgo = new GlobalOffensive(user);

mongoose.connect(process.env.MONGOOSE);

mongoose.connection.on('connected', () => {
    console.log('Mongoose is connected');
});

user.on('loggedOn', () => {
    console.log('Logged into Steam as ' + user.steamID.getSteam3RenderedID());
    user.setPersona(SteamUser.EPersonaState.Online);

    user.gamesPlayed([730]);
});

user.on("friendMessage", function (steamID, message) {
    console.log("Friend message from " + steamID + ": " + message);
    if (message == "Ping") {
        user.chatMessage(steamID, "Pong");
        console.log("Send back: Pong");
    } else {
        user.chatMessage(steamID, "MAMA MYA PICARYJA");
        console.log("Send back the standard reply");
    }
});

csgo.on('connectedToGC', () => {
    console.log('Connected to CS:GO Game Coordinator (GC)');

    //CSGO-WETqC-mumcv-tBMFR-E437W-TGwPB  GAME WITH CHICKENS

    //csgo.requestGame("CSGO-36QaB-pGzau-x7RH5-NbcG8-moi9Q");
});

async function checkForNewGames() {
    var users = await newGameCheck.checkIfNewGamesAvailable();
    if (users && users.length > 0) {
        users.forEach(async user => {
            csgo.requestGame(user.lastMatchId);
        });
    }
}

//5 minutes
//UNCOMMENT
// OLD setInterval(checkForNewGames, 300000);

cron.schedule('*/5 * * * *', checkForNewGames);


//how to create replay demo file url
//matchid: '3636589152151011577',
//matchtime: 1693418786,
// watchablematchinfo: {
//   server_ip: 181,

//if matchtime is less then 10 digints add 0 to front

//http://replay181.valve.net/730/003636589152151011577_1693418786.dem.bz2

csgo.on('matchList', async (matchData, data) => {
    if (matchData && matchData.length > 0) {
        for (const element of matchData[0].roundstatsall) {
            if (element.map) {
                gameFileGetter.getDemoFile(matchData[0].matchid, element.map)
                    .then(async (demoPath) => {
                        if (demoPath) {
                            var data = await gameParser.demofileParse(demoPath);
                            sendGameData.send(matchData[0].matchid, data);
                        }
                    })
                break;
            }
        }
    }
});

csgo.on('error', (err) => {
    console.error('CS:GO GC error:', err);
});

var logOnDetails = {
    "accountName": process.env.ACCOUNT_NAME,
    "password": process.env.ACCOUNT_PASSWORD
};

logOnDetails.auth_code = process.env.AUTH_CODE;

user.logOn(logOnDetails);

user.on('steamGuard', (domain, callback) => {
    const steamGuardCode = process.env.AUTH_CODE;
    callback(steamGuardCode);
});

//UNCOMMENT WHEN FRONTEND DEPLOYED

//TEST
// app.use(
//     cors({
//         origin: 'http://localhost:4200',
//         optionsSuccessStatus: 200
//     })
// );
//TEST

//PROD
app.use(
    cors({
        origin: ['https://debils.gay', 'https://csstats.vercel.app'],
        optionsSuccessStatus: 200
    })
);
//PROD


//UNCOMMENT WHEN CAN CHECK START
cron.schedule('0 8 * * *', () => { vacReport.checkForVacBans() });

//cron.schedule('* * * * *', () => { vacReport.checkForVacBans() });

const apiRouter = require('./api');

// Use the API router for all routes starting with '/cs'
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/cs', apiRouter);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
