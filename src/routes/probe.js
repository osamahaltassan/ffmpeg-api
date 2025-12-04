const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const util = require('util');

const logger = require('../utils/logger.js');
const utils = require('../utils/utils.js');

const router = express.Router();

// Promisify ffprobe
const ffprobeAsync = util.promisify((filepath, callback) => {
    ffmpeg(filepath).ffprobe(callback);
});

// Probe input file and return metadata
router.post('/', async (req, res, next) => {
    try {
        const savedFile = res.locals.savedFile;
        logger.debug(`Probing ${savedFile}`);
        
        const metadata = await ffprobeAsync(savedFile);
        utils.deleteFile(savedFile);
        res.status(200).send(metadata);
    } catch (err) {
        next(err);
    }
});

module.exports = router;