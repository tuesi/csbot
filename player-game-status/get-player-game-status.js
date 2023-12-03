
const PlayingUser = require('../models/playing-user');
const User = require('../mongodb/user-db-model');
const jimmy = require('../jimmy');

async function getPlayerStartedMatch(user) {

    user.getFriendsThatPlay(730, async (err, friends) => {

        const playersThatPlay = [];

        if (err) {
            console.error('Error retrieving friends:', err);
            return;
        }

        // Process the list of friends
        for (const steamID in friends) {
            const steamId = friends[steamID];
            playersThatPlay.push(steamId);
        }

        //RICH PRESENCE
        var allUsers = await User.find().exec();
        user.requestRichPresence(730, playersThatPlay, async (err, data) => {
            var playingUsers = [];
            const keys = Object.keys(data.users);
            const userArray = Object.values(data.users);
            if (userArray.length > 0) {
                for (var i = 0; i < userArray.length; i++) {
                    const richPresence = userArray[i].richPresence;
                    if (richPresence['system:lock'] === 'mmqueue' && (richPresence['game:score'] !== '[ 0 : 1 ]' && richPresence['game:score'] !== '[ 1 : 0 ]')) {
                        //is in warup or starting game
                        var playingUser = new PlayingUser();
                        playingUser.steamId = keys[i];
                        playingUser.steamGroupId = richPresence.steam_player_group;
                        playingUser.map = richPresence['game:map'];
                        const correspondingUser = allUsers.find(
                            (user) => user.steamId === playingUser.steamId
                        );
                        if (correspondingUser) {
                            playingUser.discordId = correspondingUser.discordId;
                        }
                        playingUsers.push(playingUser);
                    }
                }
                await jimmy.sendCsMatchBetDetails(playingUsers);
            }
        });
    });
}

module.exports = { getPlayerStartedMatch }

// {
//     richPresence: {
//       status: 'Playing CS:GO',
//       version: '13973',
//       'game:state': 'lobby',
//       steam_display: '#display_Lobby',
//       'game:mode': 'competitive',
//       steam_player_group: '4074664434',
//       steam_player_group_size: '5',
//       'members:numSlots': '10',
//       'members:numPlayers': '5',
//       'system:access': 'public',
//       'game:mapgroupname': 'mg_cs_office'
//     },
//     localizedString: 'In Lobby - Competitive'


//LOAD?
// {
//     richPresence: {
//       status: 'Competitive Office',
//       version: '13973',
//       'game:state': 'game',
//       steam_display: '#display_GameKnownMap',
//       'game:mode': 'competitive',
//       steam_player_group: '4074664434',
//       steam_player_group_size: '5',
//       'members:numSlots': '10',
//       'members:numPlayers': '5',
//       'system:access': 'public',
//       'system:lock': 'mmqueue',
//       'game:map': 'cs_office',
//       'game:server': 'kv'
//     },
//     localizedString: 'Competitive - Office'


//WARMUP
// {
//     richPresence: {
//       status: 'Competitive Office',
//       version: '13973',
//       'game:state': 'game',
//       steam_display: '#display_GameKnownMap',
//       'game:mode': 'competitive',
//       steam_player_group: '4074664434',
//       steam_player_group_size: '5',
//       'members:numSlots': '10',
//       'members:numPlayers': '5',
//       'system:access': 'public',
//       'system:lock': 'mmqueue',
//       'game:map': 'cs_office',
//       'game:server': 'kv'
//     },
//     localizedString: 'Competitive - Office'
//   }


//PLAYING
// {
//     richPresence: {
//       status: 'Competitive Office [ 0 : 1 ]',
//       version: '13973',
//       'game:state': 'game',
//       steam_display: '#display_GameKnownMapScore',
//       'game:mode': 'competitive',
//       steam_player_group: '4074664434',
//       steam_player_group_size: '5',
//       'members:numSlots': '10',
//       'members:numPlayers': '5',
//       'system:access': 'public',
//       'system:lock': 'mmqueue',
//       'game:map': 'cs_office',
//       'game:server': 'kv',
//       'game:score': '[ 0 : 1 ]'
//     },
//     localizedString: 'Competitive - Office [ 0 : 1 ]'
//   }