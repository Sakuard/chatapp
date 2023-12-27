const express = require('express');
const app = express();
// const https = require('https');
const http = require('http');
const WebSocketServer = require('./socketClient.js');
require('dotenv').config();
const cors = require('cors');
const fs = require('fs');

const corsSet = {
    origin: '*'
};
app.use(cors(corsSet));

const httpsOptions = {
    key: fs.readFileSync('./cert/server.key'),
    cert: fs.readFileSync('./cert/server.cert')
};

// const server = https.createServer(httpsOptions, app);
const server = http.createServer(httpsOptions, app);
const io = new WebSocketServer(server, corsSet);

app.get('/', (req, res) => {
    console.log(`req on /`)
    res.send('test');
});

server.listen(process.env.PORT, () => {
    console.log(`Server is on port:${process.env.PORT}`);
});
