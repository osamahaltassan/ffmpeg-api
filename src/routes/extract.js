const express = require('express');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const uniqueFilename = require('unique-filename');
const archiver = require('archiver');

const constants = require('../constants.js');
const logger = require('../utils/logger.js');
const utils = require('../utils/utils.js');

const router = express.Router();

// Promisify ffmpeg extraction
function extractFromVideo(inputPath, outputPath, outputOptions) {
    return new Promise((resolve, reject) => {
        const command = ffmpeg(inputPath)
            .renice(constants.defaultFFMPEGProcessPriority)
            .outputOptions(outputOptions)
            .on('error', (err) => reject(err))
            .on('end', () => resolve());

        if (outputPath.includes('%04d')) {
            command.output(outputPath).run();
        } else {
            command.save(outputPath);
        }
    });
}

// Promisify archive finalization
function finalizeArchive(archive, outputStream) {
    return new Promise((resolve, reject) => {
        outputStream.on('close', () => resolve());
        outputStream.on('error', (err) => reject(err));
        archive.on('error', (err) => reject(err));
        archive.finalize();
    });
}


// Routes for /video/extract
// Extract audio or images from video
router.post('/audio', async (req, res, next) => {
    res.locals.extract = "audio";
    return extract(req, res, next);
});

router.post('/images', async (req, res, next) => {
    res.locals.extract = "images";
    return extract(req, res, next);
});

router.get('/download/:filename', async (req, res, next) => {
    const filename = req.params.filename;
    const file = `/tmp/${filename}`;
    return utils.downloadFile(file, null, req, res, next);
});

// Extract audio or images from video
async function extract(req, res, next) {
    const extractType = res.locals.extract;
    logger.debug(`extract ${extractType}`);
    
    const fps = req.query.fps || 1;
    const compress = req.query.compress || "none";
    const ffmpegParams = {};
    let format = "png";

    if (extractType === "images") {
        format = "png";
        ffmpegParams.outputOptions = [`-vf fps=${fps}`];
    }

    if (extractType === "audio") {
        format = "wav";
        ffmpegParams.outputOptions = ['-vn', `-f ${format}`];
        
        const monoAudio = req.query.mono || "yes";
        if (monoAudio === "yes" || monoAudio === "true") {
            logger.debug("extracting audio, 1 channel only");
            ffmpegParams.outputOptions.push('-ac 1');
        } else {
            logger.debug("extracting audio, all channels");
        }
    }

    ffmpegParams.extension = format;
    const savedFile = res.locals.savedFile;
    const outputFile = uniqueFilename('/tmp/');
    logger.debug(`outputFile ${outputFile}`);
    const uniqueFileNamePrefix = outputFile.replace("/tmp/", "");
    logger.debug(`uniqueFileNamePrefix ${uniqueFileNamePrefix}`);

    try {
        // Extract audio track from video as wav
        if (extractType === "audio") {
            const wavFile = `${outputFile}.${format}`;
            await extractFromVideo(savedFile, wavFile, ffmpegParams.outputOptions);
            logger.debug(`ffmpeg process ended`);
            utils.deleteFile(savedFile);
            await utils.downloadFile(wavFile, null, req, res, next);
        }

        // Extract png images from video
        if (extractType === "images") {
            await extractFromVideo(savedFile, `${outputFile}-%04d.png`, ffmpegParams.outputOptions);
            logger.debug(`ffmpeg process ended`);
            utils.deleteFile(savedFile);

            // Read extracted files
            const files = fs.readdirSync('/tmp/').filter(fn => fn.startsWith(uniqueFileNamePrefix));
            
            if (compress === "zip" || compress === "gzip") {
                // Create zip or tar.gz archive of all images
                let archive = null;
                let extension = "";

                if (compress === "gzip") {
                    archive = archiver('tar', {
                        gzip: true,
                        zlib: { level: 9 }
                    });
                    extension = "tar.gz";
                } else {
                    archive = archiver('zip', {
                        zlib: { level: 9 }
                    });
                    extension = "zip";
                }

                const compressFileName = `${uniqueFileNamePrefix}.${extension}`;
                const compressFilePath = `/tmp/${compressFileName}`;
                logger.debug(`starting ${compress} process ${compressFilePath}`);
                
                const compressFile = fs.createWriteStream(compressFilePath);
                archive.pipe(compressFile);
                
                // Add files to archive
                for (const file of files) {
                    const filePath = `/tmp/${file}`;
                    archive.file(filePath, {name: file});
                }
                
                // Wait for archive to finalize
                await finalizeArchive(archive, compressFile);
                
                logger.debug(`${compressFileName}: ${archive.pointer()} total bytes`);
                logger.debug('archiver has been finalized and the output file descriptor has closed.');

                // Delete all images
                for (const file of files) {
                    const filePath = `/tmp/${file}`;
                    utils.deleteFile(filePath);
                }

                // Return compressed file
                await utils.downloadFile(compressFilePath, compressFileName, req, res, next);
            } else {
                // Return JSON list of extracted images
                logger.debug(`output files in /tmp`);
                const externalPort = constants.externalPort || constants.serverPort;
                const filesArray = files.map(file => {
                    logger.debug("file: " + file);
                    return {
                        name: file,
                        url: `${req.protocol}://${req.hostname}:${externalPort}${req.baseUrl}/download/${file}`
                    };
                });

                const responseJson = {
                    totalfiles: files.length,
                    description: `Extracted image files and URLs to download them. By default, downloading image also deletes the image from server. Note that port ${externalPort} in the URL may not be the same as the real port, especially if server is running on Docker/Kubernetes.`,
                    files: filesArray
                };

                res.status(200).send(responseJson);
            }
        }
    } catch (err) {
        logger.error(`${err}`);
        utils.deleteFile(savedFile);
        res.writeHead(500, {'Connection': 'close'});
        res.end(JSON.stringify({error: `${err}`}));
    }
}

module.exports = router;