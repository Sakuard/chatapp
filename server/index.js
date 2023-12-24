const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io')
require('dotenv').config();
const cors = require('cors')
const {v4:uuidv4} = require('uuid')

const corsSet = {
    origin: '*'
};
app.use(cors(corsSet))

const socket = new Server(server, {
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

socket.on('connection', socket => {
    console.log(`${socket.id}`)
    // console.log(`A user is connected: ${JSON.stringify(socket)}`)
    socket.emit('connected', `${socket.id}`)

    //
    socket.on('joinRoom', userid => {
        console.log(`userid: ${userid}`)
        if (chatroom.length === 0) {
            chatroom.push({
                roomname: `${uuidv4()}`,
                users: [userid]
            })
            console.log(`chatroom: ${JSON.stringify(chatroom)}`)
            socket.join(chatroom[0].roomname)
            socket.emit('joinedRoom', chatroom[0].roomname)
        } else {
            let isJoined = false
            for (let i = 0; i < chatroom.length; i++) {
                if (chatroom[i].users.length < 2) {
                    chatroom[i].users.push(userid)
                    socket.join(chatroom[i].roomname)
                    socket.emit('joinedRoom', chatroom[i].roomname)
                    isJoined = true
                    break
                }
            }
            if (!isJoined) {
                chatroom.push({
                    roomname: `${uuidv4()}`,
                    users: [userid]
                })
                socket.join(chatroom[chatroom.length - 1].roomname)
                socket.emit('joinedRoom', chatroom[chatroom.length - 1].roomname)
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
        chatroom.find((room, socketid) => {
            if (room.users.includes(socket.id)) {
                room.users.splice(room.users.indexOf(socket.id), 1)
                if (room.users.length === 0) {
                    chatroom.splice(socketid, 1)
                }
                console.log(chatroom)
            }
        })
    })
})



server.listen(process.env.PORT, () => {
    console.log(`Server is on port:${process.env.PORT}`)
})