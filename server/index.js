const express = require('express');
const app = express();
const https = require('https');
const http = require('http');
require('dotenv').config();
const cors = require('cors');
const fs = require('fs');
const WebSocketServer = require('./dist/socketServer.js').default;
const os = require('os');

const corsSet = {
    origin: '*'
};
app.use(cors(corsSet));

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

server.listen(process.env.PORT, () => {
    const ifaces = os.networkInterfaces();

    Object.keys(ifaces).forEach(ifname => {
        ifaces[ifname].forEach(iface => {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                return;
            }
            console.log(`Server running on http://${iface.address}:${process.env.PORT}`)
        });
    });
});
// server.listen(process.env.PORT, () => {
//     console.log(`Server is on port:${process.env.PORT}`);
// });
