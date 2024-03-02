"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-check
const http = require('http');
const https = require('https');
const { Server, Socket } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const redis = require('redis');
// const $redis = redis.createClient({ url: process.env.REDIS_SERVER });
// $redis.on('error', (err:any) => console.log('Redis Client Error', err));
// $redis.connect().then(async() => {
//     console.log(`Redis Ready`)
//     $redis.flushAll();
// });
// const $redis = require('../cache.js');
const $redis = require('./cache.js');
class WebSocketServer {
    /**
     * Constructs a WebSocketServer.
     * @param {import('http').Server | import('https').Server} server - HTTP/HTTPS server.
     * @param {{origin: string | string[]}} corsOptions - CORS configuration.
     */
    constructor(server, corsOptions) {
        /** @type {Server} io - The Socket.IO server instance. */
        this.io = new Server(server, { cors: corsOptions });
        /** @type {Map.<String, {roomfull: boolean, users: Array.<String>}>} chatrooms - chatroom map */
        this.chatrooms = new Map();
        this.setup();
    }
    setup() {
        this.io.on('connection', (socket) => {
            socket.emit('connected', `${socket.id}`);
            // socket.on('joinRoom', (userid: string) => this.joinRoom(socket, userid));
            socket.on('joinRoom/v2', (joinParams) => this.joinRoomV2(socket, joinParams));
            socket.on('sendMessage', (message) => this.sendMessage(socket, message));
            socket.on('leave', (session) => this.leaveChat(socket, session));
            socket.on('disconnect', () => this.disconnect(socket));
        });
    }
    joinRoomV2(socket, 
    // socketID: string,
    joinParams) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`joinParams: `, joinParams);
            const { id, session, secretcode } = joinParams;
            const sessionKey = `chatSession:${session}`;
            $redis.rPush(session, id);
            let joined = false;
            let joinedRoom = yield $redis.get(sessionKey);
            if (!joinedRoom) {
                let NjoinedRoom;
                if (secretcode === '') {
                    for (let [roomname, room] of this.chatrooms) {
                        if (!room.roomfull && !room.secret) {
                            NjoinedRoom = roomname;
                            $redis.set(id, sessionKey);
                            $redis.set(sessionKey, roomname);
                            room.users.push(sessionKey);
                            room.roomfull = true;
                            socket.join(roomname);
                            this.io.to(roomname).emit('joinedRoom', { text: '對方已經加入', ready: true });
                            // for test
                            socket.emit('test', { text: `roomname: ${roomname}`, ready: true });
                            joined = true;
                            break;
                        }
                    }
                    if (!joined) {
                        let roomname = uuidv4();
                        NjoinedRoom = roomname;
                        $redis.set(id, sessionKey);
                        $redis.set(sessionKey, roomname);
                        this.chatrooms.set(roomname, {
                            secret: secretcode !== '' ? true : false,
                            roomfull: false,
                            users: [sessionKey]
                        });
                        socket.join(roomname);
                        socket.emit('joinedRoom', { text: '等待對方加入', ready: false });
                        // for test
                        socket.emit('test', { text: `roomname: ${roomname}`, ready: true });
                    }
                }
                else {
                    NjoinedRoom = secretcode;
                    for (let [roomname, room] of this.chatrooms) {
                        if (roomname === secretcode && !room.roomfull) {
                            $redis.set(id, sessionKey);
                            $redis.set(sessionKey, roomname);
                            room.users.push(sessionKey);
                            room.roomfull = true;
                            socket.join(roomname);
                            this.io.to(roomname).emit('joinedRoom', { text: '對方已經加入', ready: true });
                            // for test
                            socket.emit('test', { text: `roomname: ${roomname}`, ready: true });
                            joined = true;
                            break;
                        }
                        else if (roomname === secretcode && room.roomfull) {
                            socket.emit('joinedRoomFull', { text: '房間已滿', ready: false });
                            // for test
                            socket.emit('test', { text: `roomname: ${roomname}`, ready: true });
                            joined = true;
                            break;
                        }
                    }
                    if (!joined) {
                        let roomname = secretcode;
                        $redis.set(id, sessionKey);
                        $redis.set(sessionKey, roomname);
                        this.chatrooms.set(roomname, {
                            secret: secretcode !== '' ? true : false,
                            roomfull: false,
                            users: [sessionKey]
                        });
                        socket.join(roomname);
                        socket.emit('joinedRoom', { text: '等待對方加入', ready: false });
                        // for test
                        socket.emit('test', { text: `roomname: ${roomname}`, ready: true });
                    }
                }
            }
            else {
                let roomStatus = this.chatrooms.get(joinedRoom) || { roomfull: false };
                $redis.set(id, sessionKey);
                socket.join(joinedRoom);
                let chatHistory = yield $redis.LRANGE(`roomMSG:${joinedRoom}`, 0, -1)
                    .then((msg) => {
                    const msgArr = msg.map((msg) => JSON.parse(msg));
                    console.log(`chatHistory: `, msgArr);
                    return msgArr;
                })
                    .catch((err) => console.log(`error: ${err}`));
                socket.emit('reJoin', { text: JSON.stringify(chatHistory), ready: roomStatus.roomfull });
            }
            // console.log(`chatrooms data: `, this.chatrooms)
        });
    }
    /**
     * send message to the other user in the same room
     * @param {string} message
     */
    sendMessage(socket, message) {
        return __awaiter(this, void 0, void 0, function* () {
            let userSession = message.session;
            let roomname = yield $redis.get(`chatSession:${userSession}`);
            if (roomname) {
                let msg = {
                    session: userSession,
                    msg: message.msg,
                    timestamp: new Date().toISOString(),
                };
                yield $redis.rPush(`roomMSG:${roomname}`, JSON.stringify(msg));
                socket.broadcast.to(roomname).emit(`getMessage`, msg);
                let chatHistory = yield $redis.LRANGE(`roomMSG:${roomname}`, 0, -1);
            }
        });
    }
    leaveChat(socket, session) {
        return __awaiter(this, void 0, void 0, function* () {
            let roomname = yield $redis.get(`chatSession:${session}`);
            let chatSession = `chatSession:${session}`;
            if (roomname) {
                let msg = {
                    session: session,
                    msg: '對方已經離開',
                };
                // socket.broadcast.to(roomname).emit('userDisconnect', '對方已經離開');
                socket.broadcast.to(roomname).emit('userDisconnect', msg);
                socket.leave(roomname);
                yield $redis.del(`chatSession:${session}`);
                yield $redis.del(`roomMSG:${roomname}`);
                yield $redis.del(session);
                // let chatHistory = await $redis.LRANGE(`roomMSG:${roomname}`, 0, -1)
                this.chatrooms.delete(roomname);
                // console.log(`chatrooms data: `, this.chatrooms)
            }
        });
    }
    /**
     * on disconnect, remove user from chatroom and delete chatroom if empty
     */
    disconnect(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            let session = yield $redis.get(socket.id);
            if (session) {
                session = session.replace('chatSession:', '');
                $redis.lRem(session, 1, socket.id);
            }
        });
    }
}
//module.exports = WebSocketServer;
exports.default = WebSocketServer;
