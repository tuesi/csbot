const fetch = require('node-fetch');
const loginData = { username: process.env.API_USERNAME, password: process.env.API_PASSWORD };

var token;

async function getApiToken() {
    const tokenResponse = await fetch(process.env.JIMMY_URL + "v1/auth/login", {
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

async function sendCsMatchDetails(details) {

    if (!token) {
        await getApiToken();
    }

    const resolvedDetails = await details;

    try {
        var response = await fetch(process.env.JIMMY_URL + "v1/cs/recent-game", {
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

async function sendCsVacBanDetails(details) {

    if (!token) {
        await getApiToken();
    }

    const resolvedDetails = await details;

    try {
        var response = await fetch(process.env.JIMMY_URL + "v1/cs/vac-report", {
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
            await sendCsVacBanDetails(details);
        }
    } catch {
        console.log('error sending cs data');
    }
}

module.exports = { sendCsMatchDetails, sendCsVacBanDetails }