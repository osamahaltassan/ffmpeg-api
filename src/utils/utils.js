const fs = require('fs');
const logger = require('./logger.js');
const constants = require('../constants.js');

function deleteFile(filepath) {
    if (constants.keepAllFiles === "false") {
        fs.unlinkSync(filepath);
        logger.debug(`deleted ${filepath}`);
    } else {
        logger.debug(`NOT deleted ${filepath}`);
    }
}

async function downloadFile(filepath, filename, req, res, next) {
    logger.debug(`starting download to client. file: ${filepath}`);

    return new Promise((resolve, reject) => {
        res.download(filepath, filename, (err) => {
            if (err) {
                logger.error(`download error: ${err}`);
                reject(err);
            } else {
                logger.debug(`download complete ${filepath}`);
                const doDelete = req.query.delete || "true";
                if (doDelete === "true" || doDelete === "yes") {
                    deleteFile(filepath);
                }
                resolve();
            }
        });
    });
}

module.exports = {
    deleteFile,
    downloadFile
};