const axios = require('axios');
const fs = require('fs');
const unbzip2 = require('unbzip2-stream');
const zlib = require('zlib');

//delay 60000
async function getDemoFile(matchId, demoUrl, retries = 3, delay = 60000) {

    //const localDemoBz2FilePath = `/demos/currentDemo${matchId}.dem.bz2`;
    //const localDemoFilePath = `/demos/currentDemo${matchId}.dem`;

    const localDemoBz2FilePath = `currentDemo${matchId}.dem.bz2`;
    const localDemoFilePath = `currentDemo${matchId}.dem`;

    console.log('get demo');

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
                        bz2ReadStream.destroy();
                        demWriteStream.destroy();

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

async function getFaceitDemoFile(fileUrl, matchId) {

    //const localDemoBz2FilePath = `/demos/currentDemo${matchId}.dem.gz`;
    //const localDemoFilePath = `/demos/currentDemo${matchId}.dem`;

    const localDemoGzFilePath = `currentDemo${matchId}.dem.gz`; // Change to .gz
    const localDemoFilePath = `currentDemo${matchId}.dem`;

    try {
        // Step 1: Download the GZip file
        const response = await axios.get(fileUrl, {
            responseType: 'arraybuffer' // Get the response as an ArrayBuffer
        });

        // Step 2: Write the GZip file to disk
        fs.writeFileSync(localDemoGzFilePath, Buffer.from(response.data), { flag: 'w' });

        return new Promise((resolve, reject) => {
            // Set up the streams for GZip extraction
            const gzReadStream = fs.createReadStream(localDemoGzFilePath);
            const demWriteStream = fs.createWriteStream(localDemoFilePath);

            // Pipe through zlib's gunzip to extract the file
            gzReadStream
                .pipe(zlib.createGunzip()) // Use zlib to handle GZip
                .pipe(demWriteStream);

            // Handle the finish event
            demWriteStream.on('finish', () => {
                console.log('File download and faceit file extraction complete.');
                console.log(`Extracted DEM file saved at: ${localDemoFilePath}`);
                resolve(localDemoFilePath); // Resolve the promise with the path
            });

            // Error handling for read and write streams
            gzReadStream.on('error', (error) => {
                console.error('Error reading .gz file:', error);
                reject(error); // Reject the promise on error
            });

            demWriteStream.on('error', (error) => {
                console.error('Error writing extracted .dem file:', error);
                reject(error); // Reject the promise on error
            });
        });

    } catch (e) {
        console.error('Error:', e);
    }
}

module.exports = { getDemoFile, getFaceitDemoFile };