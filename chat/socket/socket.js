// import io from 'socket.io-client';
const io = require('socket.io-client');
require('dotenv').config();

export default function Socket() {
    const socket = io('http://192.168.100.6:3100');
    socket.on('connected', () => {
        console.log(`webSocket is connected: ${socket.id}`)
    })
}