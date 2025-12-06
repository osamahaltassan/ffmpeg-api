const fs = require('fs');
const logger = require('./logger.js');
const constants = require('../constants.js');

// Optional requestId parameter for log correlation
function deleteFile(filepath, requestId) {
    const prefix = requestId ? `[${requestId}] ` : '';
    if (constants.keepAllFiles === "false") {
        fs.unlinkSync(filepath);
        logger.debug(`${prefix}deleted ${filepath}`);
    } else {
        logger.debug(`${prefix}NOT deleted ${filepath}`);
    }
}

async function downloadFile(filepath, filename, req, res, next) {
    const prefix = req.requestId ? `[${req.requestId}] ` : '';
    logger.debug(`${prefix}starting download to client. file: ${filepath}`);

    return new Promise((resolve, reject) => {
        res.download(filepath, filename, (err) => {
            if (err) {
                logger.error(`${prefix}download error: ${err}`);
                reject(err);
            } else {
                logger.debug(`${prefix}download complete ${filepath}`);
                const doDelete = req.query.delete || "true";
                if (doDelete === "true" || doDelete === "yes") {
                    deleteFile(filepath, req.requestId);
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