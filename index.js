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
const { Cron } = require("croner");
const cors = require('cors');
require('dotenv').config();

const newGameCheck = require('./new-game-check');
const gameFileGetter = require('./game-file-getter');
const gameParser = require('./parser/game-parser');
const sendGameData = require('./send-game-data');
const deleteFiles = require('./delete-files');

const vacReport = require('./vac/vac-check');
const playerGameStatus = require('./player-game-status/get-player-game-status');

const defaultDataParser = require('./parser/default-data-parser');

const faceitDemo = require('./faceit/get-faceit-game');

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

    //FOR QUICK TESTING. COMMENT WHEN NOT TESTING
    //playerGameStatus.getPlayerStartedMatch(user);
});

user.on('friendMessage', (steamID, message) => {
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
    //CSGO-OYkmR-mo9fN-MCCt7-YtphP-LwSOG GAME WITH HOSTAGE RESCUE
    // csgo.once('matchList', async (matchData, data) => {
    //     getGameData(matchData, data);
    // });
    //csgo.requestGame("CSGO-QxyzF-nv5Ft-NaO3C-a5DaQ-WmPhG");
});

async function checkForNewGames() {
    try {
        const users = await newGameCheck.checkIfNewGamesAvailable();
        if (users && users.length > 0) {
            users.forEach(async user => {
                csgo.requestGame(user.lastMatchId);
            });
        }
    } catch (error) {
        console.error("Error while getting latest game codes: ", error);
    }
}

csgo.on('matchList', async (matchData, data) => {
    await getGameData(matchData, data);
});

async function getFaceitData() {
    try {
        console.log("get faceit data");
        const users = await newGameCheck.checkIfNewFaceitGamesAvailable();
        if (users && users.length > 0) {
            users.forEach(async user => {
                const faceitDemoUrl = await faceitDemo.getMatchData(user.lastFaceitMatchId);
                const demoUrl = await faceitDemo.getFaceitDemoFile(faceitDemoUrl);
                const demoFilePath = await gameFileGetter.getFaceitDemoFile(demoUrl, user.lastFaceitMatchId);
                const gameData = await gameParser.demofileParse(demoFilePath);
                await sendGameData.sendFaceitGame(user.lastFaceitMatchId, gameData);
                await deleteFiles.deleteFiles(user.lastFaceitMatchId);
            });
        }
    } catch (error) {
        console.error("Error while getting faceit match: ", error);
    }
}

async function getGameData(matchData, data) {
    var defaultGameData = defaultDataParser.defaultDataParser(matchData);
    if (matchData && matchData.length > 0) {
        for (const element of matchData[0].roundstatsall) {
            if (element.map) {
                var gameData;
                try {
                    const demoPath = await gameFileGetter.getDemoFile(matchData[0].matchid, element.map);
                    gameData = await gameParser.demofileParse(demoPath);
                    if (!gameData) {
                        gameData = defaultGameData;
                    }
                } catch (error) {
                    console.error("Demo path or parser failed: ", error);
                    gameData = defaultGameData;
                }
                await sendGameData.send(matchData[0].matchid, gameData);
                await deleteFiles.deleteFiles(matchData[0].matchid);
                break;
            }
        }
        gameData = null;
        defaultGameData = null;
        return null;
    }
}

//5 minutes
//UNCOMMENT
// OLD setInterval(checkForNewGames, 300000);

//CSGO-n2t2x-xzLaN-S5CXf-fuvmE-bTsdA

const checkForGamesCron = Cron('*/5 * * * *', () => { checkForNewGames() });
const checkForFaceitGamesCron = Cron('*/5 * * * *', () => { getFaceitData() });
//const checkForGamesJon = Cron('*/1 * * * *', () => { checkForNewGames() });

//node --inspect index.js   

//Get player steam status. (To see if it started the game)
// cron.schedule('*/1 * * * *', () => {
//     playerGameStatus.getPlayerStartedMatch(user);
// });

//faceitDemo.getFaceitDemoFile("https://demos-europe-central.backblaze.faceit-cdn.net/cs2/1-a8750c26-9a0d-43b7-a81c-494fd45d1baa-1-1.dem.gz");
//faceitDemo.getFaceitPlayerId("diLodovico");
//faceitDemo.getPlayerMatchHistory("34048673-19e9-478b-b893-e869deb08391");
//faceitDemo.getMatchData("1-3e6f2bc8-c6ca-433b-9076-03ecbf659115");

user.on('friendRelationship', (steamID, relationship) => {
    if (relationship === SteamUser.EFriendRelationship.RequestRecipient) {
        console.log(`Received friend request from ${steamID}`);
        user.addFriend(steamID);
    }
});


//how to create replay demo file url
//matchid: '3636589152151011577',
//matchtime: 1693418786,
// watchablematchinfo: {
//   server_ip: 181,

//if matchtime is less then 10 digints add 0 to front

//http://replay181.valve.net/730/003636589152151011577_1693418786.dem.bz2

// csgo.on('matchList', async (matchData, data) => {
//     getGameData(matchData, data);
// });

csgo.on('error', (err) => {
    console.error('CS:GO GC error:', err);
});

var logOnDetails = {
    "accountName": process.env.ACCOUNT_NAME,
    "password": process.env.ACCOUNT_PASSWORD
};

logOnDetails.auth_code = process.env.AUTH_CODE;

user.logOn(logOnDetails);

user.once('steamGuard', (domain, callback) => {
    console.log('steam guard');
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
//const varCheckJob = Cron('0 6 * * *', () => { vacReport.checkForVacBans() });
//const varCheckJob = Cron('* * * * *', () => { vacReport.checkForVacBans() });

const apiRouter = require('./api');

// Use the API router for all routes starting with '/cs'
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/cs', apiRouter);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
