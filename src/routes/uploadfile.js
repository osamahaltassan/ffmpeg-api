const express = require('express');
const fs = require('fs');
const busboy = require('busboy');
const uniqueFilename = require('unique-filename');

const logger = require('../utils/logger.js');
const utils = require('../utils/utils.js');

const router = express.Router();

const constants = require('../constants.js');

// Route to handle file upload in all POST requests
// File is saved to res.locals.savedFile and can be used in subsequent routes
router.use((req, res, next) => {
    
    if (req.method === "POST") {
        logger.debug(`${__filename} path: ${req.path}`);

        let bytes = 0;
        let hitLimit = false;
        let fileName = '';
        let savedFile = uniqueFilename('/tmp/');

        const bb = busboy({
            headers: req.headers,
            limits: {
                fields: 0,
                files: 1,
                fileSize: fileSizeLimit,  // This relies on global
            }
        });

        file.on('limit', () => {
            hitLimit = true;
            const msg = `${filename} exceeds max size limit. max file size ${constants.fileSizeLimit} bytes.`;
            logger.error(msg);
            res.writeHead(500, {'Connection': 'close'});
            res.end(JSON.stringify({error: msg}));
        });

        bb.on('fieldsLimit', () => {
            const msg = "Non-file field detected. Only files can be POSTed.";
            logger.error(msg);
            const err = new Error(msg);
            err.statusCode = 400;
            next(err);
        });

        bb.on('file', (fieldname, file, info) => {
            const { filename, encoding, mimeType: mimetype } = info;

            file.on('limit', () => {
                hitLimit = true;
                const msg = `${filename} exceeds max size limit. max file size ${fileSizeLimit} bytes.`;
                logger.error(msg);
                res.writeHead(500, {'Connection': 'close'});
                res.end(JSON.stringify({error: msg}));
            });

            const log = {
                file: filename,
                encoding: encoding,
                mimetype: mimetype,
            };
            logger.debug(`file:${log.file}, encoding: ${log.encoding}, mimetype: ${log.mimetype}`);

            file.on('data', (data) => {
                bytes += data.length;
            });

            file.on('end', () => {
                log.bytes = bytes;
                logger.debug(`file: ${log.file}, encoding: ${log.encoding}, mimetype: ${log.mimetype}, bytes: ${log.bytes}`);
            });

            fileName = filename || 'upload';
            savedFile = savedFile + "-" + fileName;
            logger.debug(`uploading ${fileName}`);

            const written = file.pipe(fs.createWriteStream(savedFile));
            if (written) {
                logger.debug(`${fileName} saved, path: ${savedFile}`);
            }
        });

        bb.on('finish', () => {
            if (hitLimit) {
                utils.deleteFile(savedFile);
                return;
            }
            logger.debug(`upload complete. file: ${fileName}`);
            res.locals.savedFile = savedFile;
            next();
        });

        return req.pipe(bb);
    }
    next();
});

module.exports = router;
