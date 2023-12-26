const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io')
require('dotenv').config();
const cors = require('cors')
const {v4:uuidv4} = require('uuid');
const fs = require('fs');

const corsSet = {
    origin: '*'
};
app.use(cors(corsSet))

const httpsOptions = {
    key: fs.readFileSync('./cert/server.key'),
    cert: fs.readFileSync('./cert/server.cert')
}

const server = http.createServer(app);
// const server = http.createServer(httpsOptions, app);
const io = new Server(server, {
    cors: corsSet
})
app.get('/', (req, res) => {
    res.send('test');
});

// this chatroom variable is a dynamic array
// 1. when socket.on('joinRoom') is called, it will check if there's any chatroom don't have 2 users
// 2. if there's any chatroom don't have 2 users, it will push the user into the chatroom
// 3. if there's no chatroom don't have 2 users, it will create a new random name chatroom and push the user into the chatroom
// 4. if any user disconnect, it will remove the user from the chatroom
let chatroom = []

io.on('connection', socket => {
    console.log(`${socket.id}`)
    // console.log(`A user is connected: ${JSON.stringify(socket)}`)
    socket.emit('connected', `${socket.id}`)

    //
    socket.on('joinRoom', userid => {
        console.log(`userid: ${userid}`)
        if (chatroom.length === 0) {
            chatroom.push({
                roomfull: false,
                roomname: `${uuidv4()}`,
                users: [userid]
            })
            console.log(`chatroom: ${JSON.stringify(chatroom)}`)
            socket.join(chatroom[0].roomname)
            // socket.emit('joinedRoom', chatroom[0].roomname)
        } else {
            let isJoined = false
            for (let i = 0; i < chatroom.length; i++) {
                if (chatroom[i].users.length === 1 && chatroom[i].roomfull === false) {
                    chatroom[i].users.push(userid)
                    chatroom[i].roomfull = true
                    socket.join(chatroom[i].roomname)
                    let message = {
                        text: '對方已經加入',
                        ready: true
                    }
                    console.log(`b4 emit joinedRoom`)
                    // io.to(chatroom[i].roomname).emit('joinedRoom', message)
                    // socket.in(chatroom[i].roomname).emit('joinedRoom', message)
                    io.to(chatroom[i].roomname).emit('joinedRoom', message)

                    isJoined = true
                    break
                }
            }
            if (!isJoined) {
                chatroom.push({
                    roomfull: false,
                    roomname: `${uuidv4()}`,
                    users: [userid]
                })
                socket.join(chatroom[chatroom.length - 1].roomname)
                let message = {
                    text: '等待對方加入',
                    ready: false
                }
                // socket.emit('joinedRoom', chatroom[chatroom.length - 1].roomname)
                socket.emit('joinedRoom', message)
            }
        }
        console.log(chatroom)
    })
    
    socket.on('sendMessage', (message) => {
        console.log(`sendMessage: ${message}`)
        let room = chatroom.find(room => room.users.includes(socket.id))
        console.log(`socketid: ${socket.id}, room: ${room.roomname}`)
        socket.broadcast.to(room.roomname).emit('getMessage', message)
        // socket.emit('getMessage', message)
    })

    socket.on('disconnect', () => {
        console.log(`${socket.id} is disconnected`)
        chatroom.forEach((room, idx) => {
            if (room.users.includes(socket.id)) {
                room.users.splice(room.users.indexOf(socket.id), 1)
                let returnMessage = `對方已經離開`
                socket.broadcast.to(room.roomname).emit('userDisconnect', returnMessage)
                console.log(chatroom)
            }
            if (room.users.length === 0) {
                chatroom.splice(idx, 1)
            }
        })
    })
})



server.listen(process.env.PORT, () => {
    console.log(`Server is on port:${process.env.PORT}`)
})