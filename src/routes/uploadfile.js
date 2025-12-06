const express = require('express');
const fs = require('fs');
const busboy = require('busboy');
const uniqueFilename = require('unique-filename');

const logger = require('../utils/logger.js');
const utils = require('../utils/utils.js');
const constants = require('../constants.js');

const router = express.Router();

// Route to handle file upload in all POST requests
// File is saved to res.locals.savedFile and can be used in subsequent routes
router.use((req, res, next) => {
    if (req.method === "POST") {
        logger.debug(`[${req.requestId}] ${__filename} path: ${req.path}`);

        let bytes = 0;
        let hitLimit = false;
        let fileName = '';
        let savedFile = uniqueFilename('/tmp/');

        const bb = busboy({
            headers: req.headers,
            limits: {
                fields: 0, // No non-files allowed
                files: 1,
                fileSize: constants.fileSizeLimit,
            }
        });

        bb.on('filesLimit', () => {
            logger.error(`[${req.requestId}] upload file size limit hit. max file size ${constants.fileSizeLimit} bytes.`);
        });

        bb.on('fieldsLimit', () => {
            const msg = "Non-file field detected. Only files can be POSTed.";
            logger.error(`[${req.requestId}] ${msg}`);
            const err = new Error(msg);
            err.statusCode = 400;
            next(err);
        });

        // Handle busboy errors (e.g., malformed multipart data, invalid headers)
        bb.on('error', (err) => {
            logger.error(`[${req.requestId}] Busboy parsing error: ${err}`);
            utils.deleteFile(savedFile);
            err.statusCode = 400;
            next(err);
        });

        bb.on('file', (fieldname, file, info) => {
            const { filename, encoding, mimeType: mimetype } = info;

            file.on('limit', () => {
                hitLimit = true;
                const msg = `${filename} exceeds max size limit. max file size ${constants.fileSizeLimit} bytes.`;
                logger.error(`[${req.requestId}] ${msg}`);
                res.writeHead(500, {'Connection': 'close'});
                res.end(JSON.stringify({error: msg}));
            });

            logger.debug(`[${req.requestId}] file: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`);

            file.on('data', (data) => {
                bytes += data.length;
            });

            file.on('end', () => {
                logger.debug(`[${req.requestId}] file: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}, bytes: ${bytes}`);
            });

            fileName = filename || 'upload';
            savedFile = savedFile + "-" + fileName;
            logger.debug(`[${req.requestId}] uploading ${fileName}`);

            const written = file.pipe(fs.createWriteStream(savedFile));
            if (written) {
                logger.debug(`[${req.requestId}] ${fileName} saved, path: ${savedFile}`);
            }
        });

        bb.on('finish', () => {
            if (hitLimit) {
                utils.deleteFile(savedFile);
                return;
            }
            logger.debug(`[${req.requestId}] upload complete. file: ${fileName}`);
            res.locals.savedFile = savedFile;
            next();
        });

        return req.pipe(bb);
    }
    next();
});

module.exports = router;