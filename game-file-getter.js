const axios = require('axios');
const fs = require('fs');
const unbzip2 = require('unbzip2-stream');

async function getDemoFile(matchId, demoUrl, retries = 3, delay = 60000) {
    console.log('get demo');
    const localDemoBz2FilePath = `currentDemo${matchId}.dem.bz2`;
    const localDemoFilePath = `currentDemo${matchId}.dem`;

    function attemptRequest(retriesLeft) {
        return new Promise((resolve, reject) => {
            const makeRequest = async () => {
                try {
                    const response = await axios({
                        method: 'get',
                        url: demoUrl,
                        responseType: 'arraybuffer',
                    });

                    fs.writeFileSync(localDemoBz2FilePath, Buffer.from(response.data), { flag: 'w' });

                    const bz2ReadStream = fs.createReadStream(localDemoBz2FilePath);
                    const demWriteStream = fs.createWriteStream(localDemoFilePath);

                    bz2ReadStream.pipe(unbzip2()).pipe(demWriteStream);

                    demWriteStream.on('finish', () => {
                        console.log('File download and extraction complete.');
                        resolve(localDemoFilePath);

                        fs.unlink(localDemoBz2FilePath, (err) => {
                            if (err) {
                                console.error('Error deleting .bz2 file:', err);
                            } else {
                                console.log('.bz2 file deleted.');
                            }
                        });
                    });

                    demWriteStream.on('error', (error) => {
                        console.error('Error writing extracted .dem file:', error);
                        reject(error);
                    });
                } catch (error) {
                    console.error('Error making HTTP request:', error);
                    if (retriesLeft > 0) {
                        await new Promise((resolve) => setTimeout(resolve, delay));
                        makeRequest(retriesLeft - 1);  // Decrement retriesLeft
                    } else {
                        reject(new Error('Exhausted retries'));
                    }
                }
            };

            makeRequest();
        });
    }

    return attemptRequest(retries);
}

module.exports = { getDemoFile };