var express = require('express')
const fs = require('fs');
const busboy = require('busboy');  // Changed: lowercase, no constructor
const uniqueFilename = require('unique-filename');

var router = express.Router()
const logger = require('../utils/logger.js')

//route to handle file upload in all POST requests
//file is saved to res.locals.savedFile and can be used in subsequent routes.
router.use(function (req, res,next) {
    
    if(req.method == "POST")
    {
        logger.debug(`${__filename} path: ${req.path}`);

        let bytes = 0;
        let hitLimit = false;
        let fileName = '';
        var savedFile = uniqueFilename('/tmp/');
        let bb = busboy({  // Changed: lowercase function call, not 'new'
            headers: req.headers,
            limits: {
                fields: 0, //no non-files allowed
                files: 1,
                fileSize: fileSizeLimit,
        }});
        bb.on('filesLimit', function() {  // Changed: bb instead of busboy
            logger.error(`upload file size limit hit. max file size ${fileSizeLimit} bytes.`)
        });
        bb.on('fieldsLimit', function() {  // Changed: bb instead of busboy
            let msg="Non-file field detected. Only files can be POSTed.";
            logger.error(msg);
            let err = new Error(msg);
            err.statusCode = 400;
            next(err);
        });

        bb.on('file', function(  // Changed: bb instead of busboy
            fieldname,
            file,
            filename,
            encoding,
            mimetype
        ) {
            file.on('limit', function(file) {
                hitLimit = true;
                let msg = `${filename} exceeds max size limit. max file size ${fileSizeLimit} bytes.`
                logger.error(msg);
                res.writeHead(500, {'Connection': 'close'});
                res.end(JSON.stringify({error: msg}));
            });
            let log = {
                file: filename,
                encoding: encoding,
                mimetype: mimetype,
            };
            logger.debug(`file:${log.file}, encoding: ${log.encoding}, mimetype: ${log.mimetype}`);
            file.on('data', function(data) {
                bytes += data.length;
            });
            file.on('end', function(data) {
                log.bytes = bytes;
                logger.debug(`file: ${log.file}, encoding: ${log.encoding}, mimetype: ${log.mimetype}, bytes: ${log.bytes}`);
            });

            fileName = filename || 'upload';  // Provide fallback name
            savedFile = savedFile + "-" + fileName;
            logger.debug(`uploading ${fileName}`)
            let written = file.pipe(fs.createWriteStream(savedFile));
            if (written) {
                logger.debug(`${fileName} saved, path: ${savedFile}`)
            }
        });
        bb.on('finish', function() {  // Changed: bb instead of busboy
            if (hitLimit) {
                utils.deleteFile(savedFile);
                return;
            }
            logger.debug(`upload complete. file: ${fileName}`)
            res.locals.savedFile = savedFile;
            next();
        });
        return req.pipe(bb);  // Changed: bb instead of busboy
    }
    next();
});

module.exports = router;
