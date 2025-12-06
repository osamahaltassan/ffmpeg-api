const express = require('express');
const compression = require('compression');
const all_routes = require('express-list-endpoints');

const logger = require('./utils/logger.js');
const constants = require('./constants.js');
const requestId = require('./middleware/requestId.js');

const app = express();
const timeout = 3600000;

// Catch SIGINT and SIGTERM and exit
const handle = (signal) => {
    logger.info(`Received ${signal}. Exiting...`);
    process.exit(1);
};

process.on('SIGINT', handle);
process.on('SIGTERM', handle);

app.use(compression());

// Add request ID for log correlation
app.use(requestId);

// Log incoming requests with request ID
app.use((req, res, next) => {
    logger.info(`[${req.requestId}] ${req.method} ${req.path}`);
    next();
});

// Routes to handle file upload for all POST methods
const upload = require('./routes/uploadfile.js');
app.use(upload);

// Routes to convert audio/video/image files to mp3/mp4/jpg
const convert = require('./routes/convert.js');
app.use('/convert', convert);

// Routes to extract images or audio from video
const extract = require('./routes/extract.js');
app.use('/video/extract', extract);

// Routes to probe file info
const probe = require('./routes/probe.js');
app.use('/probe', probe);

const server = app.listen(constants.serverPort, () => {
    const host = server.address().address;
    const port = server.address().port;
    logger.info(`Server started and listening http://${host}:${port}`);
});

server.on('connection', (socket) => {
    logger.debug(`new connection, timeout: ${timeout}`);
    socket.setTimeout(timeout);
    socket.server.timeout = timeout;
    server.keepAliveTimeout = timeout;
});

app.get('/endpoints', (req, res) => {
    res.status(200).send(all_routes(app));
});

app.use((req, res, next) => {
    res.status(404).send({error: 'route not found'});
});

// Custom error handler to return text/plain and message only
app.use((err, req, res, next) => {
    const code = err.statusCode || 500;
    logger.error(`[${req.requestId}] ${err.message}`);
    res.writeHead(code, {'content-type': 'text/plain'});
    res.end(`${err.message}\n`);
});