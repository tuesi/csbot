const axios = require('axios');
const loginData = { username: process.env.API_USERNAME, password: process.env.API_PASSWORD };

var token;
var retryWithNewToken = false;

async function getApiToken() {
    try {
        const tokenResponse = await axios.post(process.env.JIMMY_URL + "v1/auth/login", loginData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    
        console.log(tokenResponse);
        if (tokenResponse.status === 200) {
            const tokenData = await tokenResponse.data;
            token = tokenData.token;
        }
    } catch (error) {
        console.error("Error getting token: ", error);
    }
}

async function sendCsMatchDetails(details) {

    if (!token) {
        await getApiToken();
    }

    const resolvedDetails = await details;

    try {
        await axios.post(process.env.JIMMY_URL + "v1/cs/recent-game", resolvedDetails, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        // Retry with a new token only once
        if (!retryWithNewToken) {
            console.error('Token issue detected. Attempting to refresh token and retrying.', error);
            retryWithNewToken = true;
            await getApiToken();
            await sendCsMatchDetails(resolvedDetails);
        } else {
            console.error('Retry with new token already attempted. Not retrying again.', error);
        }
        retryWithNewToken = false;
    }
}

async function sendCsVacBanDetails(details) {

    if (!token) {
        await getApiToken();
    }

    const resolvedDetails = await details;

    try {
        await axios.post(process.env.JIMMY_URL + "v1/cs/vac-report", resolvedDetails, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        await getApiToken();
        await sendCsVacBanDetails(resolvedDetails);
        console.log('error sending cs data');
    }
}

async function sendCsMatchBetDetails(details) {

    if (!token) {
        await getApiToken();
    }

    const resolvedDetails = await details;

    try {
        let response = await axios.post(process.env.JIMMY_URL + "v1/cs/game-start", resolvedDetails, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.status === 403) {
            await getApiToken();
            await sendCsMatchBetDetails(resolvedDetails);
        }
    } catch {
        console.log('error sending cs data');
    }
}

module.exports = { sendCsMatchDetails, sendCsVacBanDetails, sendCsMatchBetDetails }