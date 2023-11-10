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
require('dotenv').config();

const newGameCheck = require('./new-game-check');
const gameFileGetter = require('./game-file-getter');
const gameParser = require('./parser/game-parser');
const sendGameData = require('./send-game-data');

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

    // const friendSteamID = "76561198119401772"; // Replace with your friend's SteamID
    // const message = "Ka cia ziuri obuoly?";

    // user.chatMessage(friendSteamID, message);

    // You can also send a 'MachineAuth' request here if needed
    // For example: user.getMachineAuth()
});

user.on('friendsList', (friendList) => {
    // Iterate through your friends list
    for (const steamID in friendList) {
        const friend = friendList[steamID];

        // Check if the friend is online and playing a game
        if (friend.personaState === SteamUser.EPersonaState.Online && friend.gameID === 730) {
            console.log(`Friend ${steamID} is playing CS:GO`);
        }
    }
});


// async function checkFriendsGameStatus() {
//     const friends = user.myFriends;

//     // Iterate through your friends list
//     for (const steamID in friends) {
//         const friend = friends[steamID];

//         try {
//             // Make a request to the Steam Web API to get detailed friend information
//             const response = await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key={authKey}&steamids=${steamID}`);
//             const player = response.data.response.players[0];

//             // Check if the friend is playing CS:GO (game ID: 730)
//             if (player.gameid === '730') {
//                 csgo.requestPlayersProfile(steamID.toString());
//                 console.log(`${player.personaname} is playing CS:GO.`);
//             } else {
//                 console.log(`${player.personaname} is not playing CS:GO.`);
//             }
//         } catch (error) {
//             console.error('Error fetching friend information:', error);
//         }
//     }
// }

// // Set an interval to call the function every 10 minutes (600,000 milliseconds)
// setInterval(checkFriendsGameStatus, 60000);

// user.on('friendsList', async () => {
//     const friends = user.myFriends;

//     // Iterate through your friends list
//     for (const steamID in friends) {
//         const friend = friends[steamID];

//         try {
//             // Make a request to the Steam Web API to get detailed friend information
//             const response = await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key={authKey}&steamids=${steamID}`);
//             const player = response.data.response.players[0];
//             console.log(response.data.response.players[0]);

//             //if resoinse has gameid: '730' playing cs


//         } catch (error) {
//             console.error('Error fetching friend information:', error);
//         }
//     }
// });

user.on("friendMessage", function (steamID, message) {
    console.log("Friend message from " + steamID + ": " + message);
    if (message == "Ping") {
        user.chatMessage(steamID, "Pong");
        console.log("Send back: Pong");
    } else {
        user.chatMessage(steamID, "Aiiik, ka cia per nesamone parasei xD");
        console.log("Send back the standard reply");
    }
});

csgo.on('connectedToGC', () => {
    console.log('Connected to CS:GO Game Coordinator (GC)');
    // You can now perform actions that require a connection to the GC
    // For example, sending requests for CS:GO match data or other operations
    //csgo.requestGame("CSGO-vT48e-EM59i-hXdTS-wR6Lo-qOijD");

    //var data = gameParser.demofileParse('currentDemo3641994224611623367.dem');
    //var data = gameParser.demofileParse('003640312141472334150_0844041406.dem');

    //sendGameData.send("3642672110037368862", data);

    //checkForNewGames();

    //csgo.requestGame("CSGO-bFw5F-Yw4fr-D7SD5-aGQtM-hRyQN");

    // var decoder = new cs.SharecodeDecoder("CSGO-WAkZq-FN8Sk-JKJTP-7nDW5-HVMfN");
    // var decoded = decoder.decode();
    // console.log(decoded.matchId);
});

async function checkForNewGames() {
    var users = await newGameCheck.checkIfNewGamesAvailable();
    if (users && users.length > 0) {
        console.log("send");
        users.forEach(async user => {
            console.log("send2");
            console.log(user);
            console.log(user.lastMatchId);
            csgo.requestGame(user.lastMatchId);
        });
    }
}

//5 minutes
setInterval(checkForNewGames, 300000);

//CSGO-WMKvN-UGRjW-7RhvS-zX6wL-dcf8E

// csgo.on('playersProfile', async (profile) => {
//     // Check if the friend is in a competitive match
//     const steam64ID = bignumber(profile.account_id).plus('76561197960265728') + "";
//     console.log(steam64ID);
//     const response = await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key={authKey}&steamids=${steam64ID}`);
//     const player = response.data.response.players[0];
//     if (profile.matchmaking) {
//         // Fetch additional details including persona name
//         console.log(`${player.personaname} is in a competitive match.`);
//     } else {
//         console.log(`Friend with account ID ${player.personaname} is not in a competitive match.`);
//     }
// });


//how to create replay demo file url
//matchid: '3636589152151011577',
//matchtime: 1693418786,
// watchablematchinfo: {
//   server_ip: 181,

//if matchtime is less then 10 digints add 0 to front

//http://replay181.valve.net/730/003636589152151011577_1693418786.dem.bz2

csgo.on('matchList', async (matchData, data) => {
    // console.log(matchData);
    // console.log(matchData[0].roundstatsall[matchData[0].roundstatsall.length - 1]);
    // console.log(data);
    // console.log(matchData.length);
    //console.log(matchData[0].roundstatsall);
    if (matchData && matchData.length > 0) {
        //console.log(matchData[0].roundstatsall);
        for (const element of matchData[0].roundstatsall) {
            //console.log(element);
            if (element.map) {
                console.log(element.map);
                gameFileGetter.getDemoFile(matchData[0].matchid, element.map)
                    .then(async (demoPath) => {
                        console.log(demoPath);
                        if (demoPath) {
                            console.log(demoPath);
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
    "password": process.env.ACCOUNT_PASSWORD,
    "auth_code": process.env.AUTH_CODE
};

user.logOn(logOnDetails);

const apiRouter = require('./api');

// Use the API router for all routes starting with '/cs'
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/cs', apiRouter);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
