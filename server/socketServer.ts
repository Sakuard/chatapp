// @ts-check
const http = require('http');
const https = require('https');
const { Server,Socket } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

// const redis = require('redis');
// const redisClient = redis.createClient({ url: process.env.REDIS_SERVER });
// redisClient.on('error', (err:any) => console.log('Redis Client Error', err));
// redisClient.connect();

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
        this.io = new Server(server, { cors: corsOptions });

        /** @type {Map.<String, {roomfull: boolean, users: Array.<String>}>} chatrooms - chatroom map */
        this.chatrooms = new Map<string, ChatRoom>();
        
        this.setup();
    }

    private setup(): void {
        this.io.on('connection', (socket: typeof Socket) => {
            socket.emit('connected', `${socket.id}`);
            socket.on('joinRoom', (userid: string) => this.joinRoom(socket, userid));
            socket.on('joinRoom/v2', (joinParams: { id: string, secretcode: string }) => this.joinRoomV2(socket, joinParams.id, joinParams) )
            socket.on('sendMessage', (message: string) => this.sendMessage(socket, message));
            socket.on('disconnect', () => this.disconnect(socket));
        });
    }

    private joinRoomV2(
        socket: { 
            join: (arg0: string) => void; 
            emit: (arg0: string, arg1: { text: string; ready: boolean; }) => void;
        },
        userid: string,
        joinParams: { id: string, secretcode: string }
    ): void {
        // console.log(`secretjoin: `, joinParams);
        let joined = false;
        if (this.chatrooms.size === 0) {
            // const roomname = uuidv4();
            let roomname
            if (joinParams.secretcode !== '') {
                roomname = joinParams.secretcode;
                this.chatrooms.set(roomname, {
                    secret: true,
                    roomfull: false,
                    users: [userid]
                });
            }
            else {
                roomname = uuidv4();
                this.chatrooms.set(roomname, {
                    secret: false,
                    roomfull: false,
                    users: [userid]
                });
            }
            socket.join(roomname);
            socket.emit('joinedRoom', { text: '等待對方加入', ready: false });
        } else {
            if (joinParams.secretcode === '') {
                for (let [roomname, room] of this.chatrooms) {
                    if (room.users.length === 1 && !room.roomfull && !room.secret) {
                        room.users.push(userid);
                        room.roomfull = true;
                        socket.join(roomname);
                        this.io.to(roomname).emit('joinedRoom', { text: '對方已經加入', ready: true });
                        joined = true;
                        break;
                    }
                }
            }
            else {
                for (let [roomname, room] of this.chatrooms) {
                    if (roomname === joinParams.secretcode && room.roomfull) {
                        socket.emit('joinedRoomFull', { text: '滿員', ready: false });
                        joined = true;
                        break;
                    }
                    if (roomname === joinParams.secretcode && room.users.length === 1 && !room.roomfull) {
                        room.users.push(userid);
                        room.roomfull = true;
                        socket.join(roomname);
                        this.io.to(roomname).emit('joinedRoom', { text: '對方已經加入', ready: true });
                        joined = true;
                        break;
                    }
                    else if (roomname === joinParams.secretcode && room.users.length === 1 && room.roomfull) {
                        socket.emit('joinedRoom', { text: '房間已滿', ready: false });
                        joined = true;
                        break;
                    }
                }
            }
                
            if (!joined) {
                if (joinParams.secretcode !== '') {
                    for (const [roomname, room] of this.chatrooms) {
                        if (roomname === joinParams.secretcode) {
                            socket.emit('joinedRoomFull', { text: '滿員', ready: false });
                            return;
                        }
                    }
                    const newRoomName = joinParams.secretcode;
                    this.chatrooms.set(newRoomName, {
                        secret: true,
                        roomfull: false,
                        users: [userid]
                    });
                    socket.join(newRoomName);
                    socket.emit('joinedRoom', { text: '等待對方加入', ready: false });
                }
                else {
                    const newRoomName = uuidv4();
                    this.chatrooms.set(newRoomName, {
                        secret: false,
                        roomfull: false,
                        users: [userid]
                    });
                    socket.join(newRoomName);
                    socket.emit('joinedRoom', { text: '等待對方加入', ready: false });
                }
            }
            else {

            }
        }
    }

    /**
     * use socket.id to join room
     * @param {object} socket - socket object
     * @param {string} userid - user id
     */
    private joinRoom(
        socket: { 
            join: (arg0: string) => void; 
            emit: (arg0: string, arg1: { text: string; ready: boolean; }) => void;
        },
        userid: string
    ): void {
        // console.log(`\nuserid: ${JSON.stringify(userid)}\n`);
        let joined = false;
        if (this.chatrooms.size === 0) {
            const roomname = uuidv4();
            this.chatrooms.set(roomname, {
                secret: false,
                roomfull: false,
                users: [userid]
            });
            socket.join(roomname);
            socket.emit('joinedRoom', { text: '等待對方加入', ready: false });
        } else {
            for (let [roomname, room] of this.chatrooms) {
                if (room.users.length === 1 && !room.roomfull && !room.secret) {
                    room.users.push(userid);
                    room.roomfull = true;
                    socket.join(roomname);
                    this.io.to(roomname).emit('joinedRoom', { text: '對方已經加入', ready: true });
                    joined = true;
                    break;
                }
            }

            if (!joined) {
                const newRoomName = uuidv4();
                this.chatrooms.set(newRoomName, {
                    secret: false,
                    roomfull: false,
                    users: [userid]
                });
                socket.join(newRoomName);
                socket.emit('joinedRoom', { text: '等待對方加入', ready: false });
            }
        }
    }
    
    /**
     * send message to the other user in the same room
     * @param {string} message 
     */
    private sendMessage(socket: { id: string; broadcast: { to: (arg0: string) => { (): any; new(): any; emit: { (arg0: string, arg1: any): void; new(): any; }; }; }; }, message: any): void {
        for (let [roomname, room] of this.chatrooms) {
            if (room.users.includes(socket.id)) {
                socket.broadcast.to(roomname).emit('getMessage', message);
                break;
            }
        }
    }
    
    /**
     * on disconnect, remove user from chatroom and delete chatroom if empty
     */
    private disconnect(
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
    ): void {
        // console.log(`\nsocket.id: ${JSON.stringify(socket.id)}`);
        for (let [roomname, room] of this.chatrooms) {
            if (room.users.includes(socket.id)) {
                room.users.splice(room.users.indexOf(socket.id), 1);
                socket.broadcast.to(roomname).emit('userDisconnect', '對方已經離開');
                if (room.users.length === 0) {
                    this.chatrooms.delete(roomname);
                }
                break;
            }
        }
    }
}

//module.exports = WebSocketServer;
export default WebSocketServer;
