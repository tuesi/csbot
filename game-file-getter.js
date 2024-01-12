const axios = require('axios');
const fs = require('fs');
const unbzip2 = require('unbzip2-stream');

//delay 60000
async function getDemoFile(matchId, demoUrl, retries = 3, delay = 60000) {
    console.log('get demo');
    const localDemoBz2FilePath = `/demos/currentDemo${matchId}.dem.bz2`;
    const localDemoFilePath = `/demos/currentDemo${matchId}.dem`;

    // const localDemoBz2FilePath = `currentDemo${matchId}.dem.bz2`;
    // const localDemoFilePath = `currentDemo${matchId}.dem`;

    function attemptRequest(retriesLeft) {
        return new Promise((resolve, reject) => {
            const makeRequest = async (retriesLeft) => {
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
                        fs.close(bz2ReadStream, (err) => {
                            if (err)
                                console.error('Failed to close file', err);
                            else {
                                console.log("\n> File Closed successfully");
                            }
                        });
                        fs.close(demWriteStream, (err) => {
                            if (err)
                                console.error('Failed to close file', err);
                            else {
                                console.log("\n> File Closed successfully");
                            }
                        });
                        resolve(localDemoFilePath);
                    });

                    bz2ReadStream.on('error', (error) => {
                        console.error('Error reading .bz2 file:', error);
                        reject(error);
                    });

                    demWriteStream.on('error', (error) => {
                        console.error('Error writing extracted .dem file:', error);
                        reject(error);
                    });
                } catch (error) {
                    console.error('Error making HTTP request:', error);
                    if (retriesLeft > 0) {
                        console.log(retriesLeft - 1 + " RETRIES LEFT");
                        await new Promise((resolve) => setTimeout(resolve, delay));
                        return makeRequest(retriesLeft - 1);  // Decrement retriesLeft
                    } else {
                        reject(new Error('Exhausted retries'));
                    }
                }
            };

            return makeRequest(retriesLeft);
        });
    }

    return attemptRequest(retries);
}

module.exports = { getDemoFile };