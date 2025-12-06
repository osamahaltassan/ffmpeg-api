const express = require('express');
const ffmpeg = require('fluent-ffmpeg');

const constants = require('../constants.js');
const logger = require('../utils/logger.js');
const utils = require('../utils/utils.js');

const router = express.Router();

// Promisify ffmpeg conversion
function convertFile(inputPath, outputPath, outputOptions) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .renice(constants.defaultFFMPEGProcessPriority)
            .outputOptions(outputOptions)
            .on('error', (err) => reject(err))
            .on('end', () => resolve())
            .save(outputPath);
    });
}


// Routes for /convert
// Adds conversion type and format to res.locals to be used in convert function
router.post('/audio/to/mp3', async (req, res, next) => {
    res.locals.conversion = "audio";
    res.locals.format = "mp3";
    return convert(req, res, next);
});

router.post('/audio/to/wav', async (req, res, next) => {
    res.locals.conversion = "audio";
    res.locals.format = "wav";
    return convert(req, res, next);
});

router.post('/video/to/mp4', async (req, res, next) => {
    res.locals.conversion = "video";
    res.locals.format = "mp4";
    return convert(req, res, next);
});

router.post('/image/to/jpg', async (req, res, next) => {
    res.locals.conversion = "image";
    res.locals.format = "jpg";
    return convert(req, res, next);
});

// Convert audio or video or image to mp3 or mp4 or jpg
async function convert(req, res, next) {
    const format = res.locals.format;
    const conversion = res.locals.conversion;
    logger.debug(`[${req.requestId}] path: ${req.path}, conversion: ${conversion}, format: ${format}`);

    const ffmpegParams = {
        extension: format
    };

    if (conversion === "image") {
        ffmpegParams.outputOptions = ['-pix_fmt yuv422p'];
    }
    if (conversion === "audio") {
        if (format === "mp3") {
            ffmpegParams.outputOptions = ['-codec:a libmp3lame'];
        }
        if (format === "wav") {
            ffmpegParams.outputOptions = ['-codec:a pcm_s16le'];
        }
    }
    if (conversion === "video") {
        ffmpegParams.outputOptions = [
            '-codec:v libx264',
            '-profile:v high',
            '-r 15',
            '-crf 23',
            '-preset ultrafast',
            '-b:v 500k',
            '-maxrate 500k',
            '-bufsize 1000k',
            '-vf scale=-2:640',
            '-threads 8',
            '-codec:a libfdk_aac',
            '-b:a 128k',
        ];
    }

    const savedFile = res.locals.savedFile;
    if (!savedFile || savedFile === './ffmpegapi') {
        logger.error(`[${req.requestId}] Invalid saved file path`);
        return res.status(400).json({error: 'File upload failed - invalid path'});
    }

    const outputFile = savedFile + '-output.' + ffmpegParams.extension;
    logger.debug(`[${req.requestId}] begin conversion from ${savedFile} to ${outputFile}`);

    try {
        await convertFile(savedFile, outputFile, ffmpegParams.outputOptions);
        utils.deleteFile(savedFile, req.requestId);
        await utils.downloadFile(outputFile, null, req, res, next);
    } catch (err) {
        logger.error(`[${req.requestId}] Conversion error: ${err}`);
        utils.deleteFile(savedFile, req.requestId);
        next(err);
    }
}

module.exports = router;