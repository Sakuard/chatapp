// @ts-check
const http = require('http');
const https = require('https');
const { Server,Socket } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const mem = process.memoryUsage();

const redis = require('redis');
// const $redis = redis.createClient({ url: process.env.REDIS_SERVER });
// $redis.on('error', (err:any) => console.log('Redis Client Error', err));
// $redis.connect().then(async() => {
//     console.log(`Redis Ready`)

//     $redis.flushAll();
// });
// const $redis = require('../cache.js');
const $redis = require('./cache.js');


interface ChatRoom {
    secret: boolean;
    roomfull: boolean;
    users: string[];
}

class WebSocketServer {
    private io: typeof Server;
    private chatrooms: Map<string,ChatRoom>;

    /**
     * Constructs a WebSocketServer.
     * @param {import('http').Server | import('https').Server} server - HTTP/HTTPS server.
     * @param {{origin: string | string[]}} corsOptions - CORS configuration.
     */
    constructor(server: typeof http.Server | typeof https.Server, corsOptions: { origin: string | string[] }) {

        /** @type {Server} io - The Socket.IO server instance. */
        this.io = new Server(
            server,
            {
                cors: corsOptions,
                path: '/websocket'
            });

        /** @type {Map.<String, {roomfull: boolean, users: Array.<String>}>} chatrooms - chatroom map */
        this.chatrooms = new Map<string, ChatRoom>();
        
        this.setup();
    }

    private setup(): void {
        this.io.on('connection', (socket: typeof Socket) => {
            // console.log(`socket.id: `, socket.id);
            socket.emit('connected', `${socket.id}`);
            // socket.on('joinRoom', (userid: string) => this.joinRoom(socket, userid));
            socket.on('joinRoom/v3', (joinParams: { id: string, session: string, secretcode: string }) => this.joinRoomV3(socket, joinParams) )
            socket.on('joinRoom/v2', (joinParams: { id: string, session: string, secretcode: string }) => this.joinRoomV2(socket, joinParams) )
            socket.on('sendMessage', (message: { session: string, msg: string }) => this.sendMessage(socket, message));
            socket.on('leave', (session: string) => this.leaveChat(socket, session)) ;   
            socket.on('disconnect', () => this.disconnect(socket));

            socket.on('keyin', (session:  string) => this.keyin(socket, session))
            socket.on('keyout', (session:  string) => this.keyout(socket, session))
            
            socket.on('data', () => {
                console.log(`redis: `, $redis)
                console.log(`chatrooms: `, this.chatrooms)
            })
        });
    }

    private async keyin(
        socket: {
            id: string;
            broadcast: {
                to: (arg0: string) => { (): any; new(): any; emit: { (arg0: string, arg1: string): void; new(): any; }; };
            };
        },
        session: string
    ): Promise<void> {
        let userSession = session;
        let roomname = await $redis.get(`chatSession:${userSession}`)
        if (roomname) {
            // console.log(`keyin`)
            socket.broadcast.to(roomname).emit(`keyin`,'對方正在輸入...');
        }
    }
    private async keyout(
        socket: {
            id: string;
            broadcast: {
                to: (arg0: string) => { (): any; new(): any; emit: { (arg0: string, arg1: string): void; new(): any; }; };
            };
        },
        session: string
    ): Promise<void> {
        let userSession = session;
        let roomname = await $redis.get(`chatSession:${userSession}`)
        if (roomname) {
            // console.log(`keyout`)
            socket.broadcast.to(roomname).emit(`keyout`,'對方停止輸入...');
        }
    }

    private async joinRoomV3(
        socket: {
            join: (arg0: string) => void;
            emit: (arg0: string, arg1: { text: string; ready: boolean; }) => void;
        },
        joinParams: { id: string, session: string, secretcode: string }
    ): Promise<void> {
        const { id, session, secretcode } = joinParams;
        const sessionKey = `chatSession:${session}`
        $redis.rPush(session, id);
        let joined = false;
        let joinedRoom = await $redis.get(sessionKey);
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
            } else {
                NjoinedRoom = secretcode;
                for (let [roomname, room] of this.chatrooms) {
                    if (roomname.startsWith(secretcode) && !room.roomfull) {
                        $redis.set(id, sessionKey);
                        $redis.set(sessionKey, roomname);
                        room.users.push(sessionKey);
                        room.roomfull = true;
                        socket.join(roomname);
                        this.io.to(roomname).emit('joinedRoom', { text: '對方已經加入', ready: true });
                        // for test
                        // socket.emit('test', { text: `roomname: ${roomname}`, ready: true });
                        joined = true;
                        break;
                    }
                }
                if  (!joined) {
                    let roomname = `${secretcode}:${uuidv4()}`;
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
                    // socket.emit('test', { text: `roomname: ${roomname}`, ready: true });
                }
                
            }
        } else {
            let roomStatus = this.chatrooms.get(joinedRoom) || { roomfull: false };
            $redis.set(id, sessionKey);
            socket.join(joinedRoom);
            let chatHistory =
                await $redis.LRANGE(`roomMSG:${joinedRoom}`, 0, -1)
                    .then((msg: any) => {
                        const msgArr = msg.map((msg: string ) => JSON.parse(msg))
                        // console.log(`chatHistory: `, msgArr)
                        return msgArr;
                    })
                    .catch((err: any) => console.log(`error: ${err}`));
            socket.emit('reJoin', { text: JSON.stringify(chatHistory), ready: roomStatus.roomfull });
        }
    }
    private async joinRoomV2(
        socket: { 
            join: (arg0: string) => void; 
            emit: (arg0: string, arg1: { text: string; ready: boolean; }) => void;
        },
        // socketID: string,
        joinParams: { id: string, session: string, secretcode: string }
    ): Promise<void> {
        // console.log(`joinParams: `, joinParams);
        // console.log(`${joinParams.id} joined`)

        const { id, session, secretcode } = joinParams;
        const sessionKey = `chatSession:${session}`
        $redis.rPush(session, id);
        let joined = false;

        let joinedRoom = await $redis.get(sessionKey);
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
            let chatHistory =
                await $redis.LRANGE(`roomMSG:${joinedRoom}`, 0, -1)
                    .then((msg: any) => {
                        const msgArr = msg.map((msg: string ) => JSON.parse(msg))
                        // console.log(`chatHistory: `, msgArr)
                        return msgArr;
                    })
                    .catch((err: any) => console.log(`error: ${err}`));
            socket.emit('reJoin', { text: JSON.stringify(chatHistory), ready: roomStatus.roomfull });
        }

        // console.log(`chatrooms data: `, this.chatrooms)
    }
    
    /**
     * send message to the other user in the same room
     * @param {string} message 
     */
    private async sendMessage(
        socket:{
            id: string;
            broadcast: {
                to: (arg0: string) => { (): any; new(): any; emit: { (arg0: string, arg1: any): void; new(): any; }; }; };
            },
        message: {
            session: string;
            msg: string;
        })
    : Promise<void> {
        let userSession = message.session;
        let roomname = await $redis.get(`chatSession:${userSession}`)
        if (roomname) {
            let msg = {
                session: userSession,
                msg: message.msg,
                timestamp: new Date().toISOString(),
            }
            await $redis.rPush(`roomMSG:${roomname}`, JSON.stringify(msg));
            socket.broadcast.to(roomname).emit(`getMessage`, msg);
            let chatHistory = await $redis.LRANGE(`roomMSG:${roomname}`, 0, -1)
        }
    }
    
    private async leaveChat(
        socket: {
            id: string;
            broadcast: {
                to: (arg0: string) => {
                    (): any;
                    new(): any;
                    emit: {
                        // (arg0: string,arg1: string): void;
                        (arg0: string,arg1: any): void;
                        new(): any; 
                    };
                };
            };
            leave: (arg0: string) => void;
            emit: (arg0: string, arg1: string) => void;
        },
        session: string
    ): Promise<void> {
        let roomname = await $redis.get(`chatSession:${session}`)
        let chatSession = `chatSession:${session}`
        if (roomname) {
            let msg = {
                session: session,
                msg: '對方已經離開',
            }
            // socket.broadcast.to(roomname).emit('userDisconnect', '對方已經離開');
            socket.broadcast.to(roomname).emit('userDisconnect', msg);
            socket.leave(roomname);
            await $redis.del(`chatSession:${session}`);
            let idx = this.chatrooms.get(roomname)?.users.indexOf(chatSession);
            if (idx !== undefined) {
                console.log(`del idx`)
                this.chatrooms.get(roomname)?.users.splice(idx, 1);
            }
            console.log(`chatroom room: `, this.chatrooms.get(roomname)?.users)
            if (this.chatrooms.get(roomname)?.users.length === 0) {
                await $redis.del(`roomMSG:${roomname}`);
                this.chatrooms.delete(roomname);    
            }
            await $redis.del(session);
            // let chatHistory = await $redis.LRANGE(`roomMSG:${roomname}`, 0, -1)

            // this.chatrooms.delete(roomname);
            // console.log(`chatrooms data: `, this.chatrooms)
        }
    }

    /**
     * on disconnect, remove user from chatroom and delete chatroom if empty
     */
    private async disconnect(
        socket: {
            id: string;
            broadcast: {
                to: (arg0: string) => {
                    (): any;
                    new(): any;
                    emit: {
                        (arg0: string,arg1: string): void;
                        new(): any; 
                    };
                };
            };
        }
    ): Promise<void> {
        // console.log(`disconnect: `, socket.id)
        let sessionKey = await $redis.get(socket.id);
        if (sessionKey) {
            let session = sessionKey.replace('chatSession:', '');

            $redis.lRem(session, 1, socket.id);
            $redis.del(socket.id);
        }
    }
}

//module.exports = WebSocketServer;
export default WebSocketServer;
