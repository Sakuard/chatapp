// @ts-check
const http = require('http');
const https = require('https');
const { Server,Socket } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const redis = require('redis');
const $redis = redis.createClient({ url: process.env.REDIS_SERVER });
$redis.on('error', (err:any) => console.log('Redis Client Error', err));
$redis.connect().then(async() => {
    console.log(`Redis Ready`)

    $redis.flushAll();
});

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
            // socket.on('joinRoom', (userid: string) => this.joinRoom(socket, userid));
            socket.on('joinRoom/v2', (joinParams: { id: string, session: string, secretcode: string }) => this.joinRoomV2(socket, joinParams) )
            socket.on('sendMessage', (message: { session: string, msg: string }) => this.sendMessage(socket, message));
            socket.on('leave', (session: string) => this.leaveChat(socket, session)) ;   
            socket.on('disconnect', () => this.disconnect(socket));
        });
    }

    private async joinRoomV2(
        socket: { 
            join: (arg0: string) => void; 
            emit: (arg0: string, arg1: { text: string; ready: boolean; }) => void;
        },
        // socketID: string,
        joinParams: { id: string, session: string, secretcode: string }
    ): Promise<void> {
        console.log(`joinParams: `, joinParams);

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
            console.log(`sessionKey !exist : ${NjoinedRoom}`);
        }
        else {
            let roomStatus = this.chatrooms.get(joinedRoom) || { roomfull: false };
            console.log(`roomStatus: `, roomStatus); 
            $redis.set(id, sessionKey);
            console.log(`sessionKey exist : ${joinedRoom}`);
            socket.join(joinedRoom);
            let chatHistory =
                await $redis.LRANGE(`roomMSG:${joinedRoom}`, 0, -1)
                    .then((msg: any) => {
                        console.log(`msg in redis: `, msg)
                        const msgArr = msg.map((msg: string ) => JSON.parse(msg))
                        return msgArr;
                    })
                    .catch((err: any) => console.log(`error: ${err}`));
            console.log(`chatHistory: `,chatHistory);
            socket.emit('reJoin', { text: JSON.stringify(chatHistory), ready: roomStatus.roomfull });
        }


        console.log(`redis session:${session} data\n`, await $redis.lRange(session, 0, -1))
        console.log(`chatrooms data: `, this.chatrooms)

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
            $redis.rPush(`roomMSG:${roomname}`, JSON.stringify(msg));
            socket.broadcast.to(roomname).emit(`getMessage`, msg);
            let chatHistory = await $redis.LRANGE(`roomMSG:${roomname}`, 0, -1)
            console.log(`chatHistory: ${chatHistory}`);
        }
        // for (let [roomname, room] of this.chatrooms) {
        //     if (room.users.includes(socket.id)) {
        //         console.log(`from: ${message.session}, to: ${roomname}, msg: ${message}`)
        //         let params = {
        //             text: message.msg,
        //             id: message.session
        //         }
        //         socket.broadcast.to(roomname).emit('getMessage', params);

        //         break;
        //     }
        // }
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
        console.log(`on leave... ${session}`)
        let roomname = await $redis.get(`chatSession:${session}`)
        console.log(`leave roomname: ${roomname}`)
        if (roomname) {
            let msg = {
                session: session,
                msg: '對方已經離開',
            }
            // socket.broadcast.to(roomname).emit('userDisconnect', '對方已經離開');
            socket.broadcast.to(roomname).emit('userDisconnect', msg);
            socket.leave(roomname);
            $redis.del(`chatSession:${session}`);
            $redis.del(`roomMSG:${roomname}`);
            let chatHistory = await $redis.LRANGE(`roomMSG:${roomname}`, 0, -1)
            console.log(`chatHistory: ${chatHistory}`);
            this.chatrooms.delete(roomname);
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
        
        let session = await $redis.get(socket.id);
        session = session.replace('chatSession:', '');
        console.log(`on disconnect... ${session}`)
        $redis.lRem(session, 1, socket.id);
        console.log(`redis session:${session} data\n`, await $redis.lRange(session, 0, -1))
        // let roomname = await $redis.get(session)

        // const idx = this.chatrooms.get(roomname)?.users.indexOf(session);
        // if (idx !== undefined && idx !== -1) {
        //     this.chatrooms.get(roomname)?.users.splice(idx, 1);
        // }
        // if (this.chatrooms.get(roomname)?.users.length === 0) {
        //     this.chatrooms.delete(roomname);
        // }
        // $redis.del(socket.id);
        // $redis.del(`chatSession:${session}`);

        // console.log(`chatrooms data: `, this.chatrooms)
    }
}

//module.exports = WebSocketServer;
export default WebSocketServer;
