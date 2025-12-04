const express = require('express');
const compression = require('compression');
const all_routes = require('express-list-endpoints');

const logger = require('./utils/logger.js');
const constants = require('./constants.js');

const app = express();
const timeout = 3600000;

// Catch SIGINT and SIGTERM and exit
// Using a single function to handle multiple signals
const handle = (signal) => {
    logger.info(`Received ${signal}. Exiting...`);
    process.exit(1);
};

// SIGINT is typically CTRL-C
process.on('SIGINT', handle);
// SIGTERM is sent to terminate process, for example docker stop sends SIGTERM
process.on('SIGTERM', handle);

app.use(compression());

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

const MarkdownIt = require('markdown-it');
const md = new MarkdownIt({
    html: true,         // Allow HTML in source
    linkify: true,      // Auto-convert URL-like text to links
    typographer: true   // Nice quotes, dashes, etc.
});

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
    const message = err.message;
    res.writeHead(code, {'content-type': 'text/plain'});
    res.end(`${err.message}\n`);
});