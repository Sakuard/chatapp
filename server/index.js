const express = require('express');
const app = express();
const https = require('https');
const http = require('http');
require('dotenv').config();
const cors = require('cors');
const fs = require('fs');
const mem = process.memoryUsage();

const WebSocketServer = require('./dist/socketServer.js').default;

const corsSet = {
    // origin: 'http://192.168.100.5:19006',
    origin: '*',
};
app.use(cors(corsSet));
app.set('trust proxy', true);

// const httpsOptions = {
//     key: fs.readFileSync('./cert/server.key'),
//     cert: fs.readFileSync('./cert/server.cert')
// };

// const server = https.createServer(httpsOptions, app);
const server = http.createServer(app);
const io = new WebSocketServer(server, corsSet);


app.get('/', (req, res) => {
    console.log(`req on /`)
    res.send('api test data');
});
app.get('/sys/memory', (req, res) => {
    let response = {
        memory: {
            rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
            heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            external: `${(mem.external / 1024 / 1024).toFixed(2)} MB`,
        }
    }
    res.send(response);
})

server.listen(process.env.PORT, () => {
    console.log(`Server is on port:${process.env.PORT}`);
});
