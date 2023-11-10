const fetch = require('node-fetch');
const loginData = { username: process.env.API_USERNAME, password: process.env.API_PASSWORD };

var token;

// async function getApiToken() {
//     const tokenResponse = await fetch("https://dzimyneutron.herokuapp.com/v1/auth/login", {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(loginData)
//     });
//     if (tokenResponse.status == 200) {
//         const token = await tokenResponse.json();
//         this.token = token.token;
//     }
// }

async function getApiToken() {
    console.log('get token');
    const tokenResponse = await fetch("https://dzimyneutron.herokuapp.com/v1/auth/login", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
    });

    if (tokenResponse.status == 200) {
        const tokenData = await tokenResponse.json();
        token = tokenData.token;
        console.log(token);
    }
}

// async function sendCsMatchDetails(details) {
//     console.log("send");
//     try {
//         await fetch("https://dzimyneutron.herokuapp.com/v1/cs/recent-gamet", {
//             method: 'POST',
//             headers: {
//                 Authorization: `Bearer ${this.token}`,
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(details)
//         });
//     } catch {
//         console.log('error sending cs data');
//     }
// }

async function sendCsMatchDetails(details) {

    //Maybe need to remove when deploying
    await getApiToken();

    const resolvedDetails = await details;

    try {
        var response = await fetch("https://dzimyneutron.herokuapp.com/v1/cs/recent-game", {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resolvedDetails)
        });

        console.log(response);
        if (response.status === 403) {
            await getApiToken();
            await sendCsMatchDetails(details);
        }
    } catch {
        console.log('error sending cs data');
    }
}

module.exports = { sendCsMatchDetails }