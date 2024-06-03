const fs = require('fs');

async function deleteFiles(matchId) {
    const localDemoBz2FilePath = `/demos/currentDemo${matchId}.dem.bz2`;
    const localDemoFilePath = `/demos/currentDemo${matchId}.dem`;

    //const localDemoBz2FilePath = `currentDemo${matchId}.dem.bz2`;
    //const localDemoFilePath = `currentDemo${matchId}.dem`;

    fs.access(localDemoBz2FilePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error('File does not exist:', err);
            return;
        }

        // File exists, so delete it
        fs.unlink(localDemoBz2FilePath, (err) => {
            if (err) {
                console.error('Error deleting .bz2 file:', err);
                return;
            }
            console.log('.bz2 file deleted successfully');
        });
    });

    fs.access(localDemoFilePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error('File does not exist:', err);
            return;
        }

        // File exists, so delete it
        fs.unlink(localDemoFilePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return;
            }
            console.log('File deleted successfully');
        });
    });
}

module.exports = { deleteFiles };