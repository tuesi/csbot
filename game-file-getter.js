const axios = require('axios');
const fs = require('fs');
const unbzip2 = require('unbzip2-stream');

async function getDemoFile(matchId, demoUrl) {
    console.log('get demo');
    const localDemoBz2FilePath = `currentDemo${matchId}.dem.bz2`;
    const localDemoFilePath = `currentDemo${matchId}.dem`;

    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios({
                method: 'get',
                url: demoUrl,
                responseType: 'arraybuffer', // This ensures that the response is treated as binary data
            });

            // Save the downloaded .dem.bz2 file
            fs.writeFileSync(localDemoBz2FilePath, Buffer.from(response.data), { flag: 'w' });

            // Create a read stream for the .dem.bz2 file and a write stream for the extracted .dem file
            const bz2ReadStream = fs.createReadStream(localDemoBz2FilePath);
            const demWriteStream = fs.createWriteStream(localDemoFilePath);

            // Pipe the read stream through unbzip2 and then to the .dem file
            bz2ReadStream.pipe(unbzip2()).pipe(demWriteStream);

            // Listen for the 'finish' event to know when writing is complete
            demWriteStream.on('finish', () => {
                console.log('File download and extraction complete.');
                resolve(localDemoFilePath);

                // Delete the .bz2 file after extraction
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
            reject(error);
        }
    });
}

module.exports = { getDemoFile };