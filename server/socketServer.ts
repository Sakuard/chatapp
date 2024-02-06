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
            socket.on('joinRoom/v2', (joinParams: { id: string, session: string, secretcode: string }) => this.joinRoomV2(socket, joinParams.id, joinParams) )
            socket.on('sendMessage', (message: string) => this.sendMessage(socket, message));
            socket.on('disconnect', () => this.disconnect(socket));
        });
    }

    private async joinRoomV2(
        socket: { 
            join: (arg0: string) => void; 
            emit: (arg0: string, arg1: { text: string; ready: boolean; }) => void;
        },
        socketID: string,
        joinParams: { id: string, session: string, secretcode: string }
    ): Promise<void> {
        // console.log(`secretjoin: `, joinParams);
        console.log(`joinParams: `, joinParams);
        let joined = false;

        $redis.set(socketID, joinParams.session);

        let chatRoom = await $redis.get(joinParams.session).catch((err: any) => console.log(`joinRoomV2(), $redis.getRoom err: `, err) );
        console.log(`chatRoom get: `, chatRoom)
        /** 
         * 這邊在查找的時候，如果有找到房間，並且ready狀態為true，表示有成功配對
         * 但如果users.length < 1，表示配對的user已經離開，需要重新配對
         */
        if (chatRoom !== null && chatRoom !== undefined) {
            let chatHistory = await $redis.get(chatRoom).catch((err: any) => console.log(`joinRoomV2(), $redis.getHistory err: `, err) );
            console.log(`chatHistory: `, chatHistory);

            if (chatHistory.ready && chatHistory.users.length < 1) {
                $redis.del(chatRoom);
                $redis.del(joinParams.session);
            }

            if (!chatHistory.ready) {
                socket.join(chatRoom);
                let reJoinParams = {
                    ready: false,
                    users: [joinParams.session],
                    text: chatHistory.text
                }
                socket.emit('reJoin', reJoinParams);

            }
            else {
                let users = JSON.parse(chatHistory.users);
                let reJoinParams = {
                    ready: true,
                    users: [...users, joinParams.session],
                    text: chatHistory
                }
    
                this.chatrooms.set(chatRoom, {
                    secret: joinParams.secretcode !== '' ? true : false,
                    roomfull: true,
                    users: [...users, joinParams.session]
                })
                socket.join(chatRoom);
                socket.emit('reJoin', reJoinParams);
            }
            return;
        }

        if (this.chatrooms.size === 0) {
            let roomname = joinParams.secretcode !== '' ? joinParams.secretcode : uuidv4();

            this.chatrooms.set(roomname, {
                secret: joinParams.secretcode !== '' ? true : false,
                roomfull: false,
                users: [joinParams.session]
            })
            
            socket.join(roomname);
            $redis.set(joinParams.session, roomname);
            let roomStatus = {
                ready: false,
                users: [joinParams.session],
                text: []
            }
            $redis.set(roomname, JSON.stringify(roomStatus));
            socket.emit('joinedRoom', { text: '等待對方加入', ready: false });
        } else {
            if (joinParams.secretcode === '') {
                for (let [roomname, room] of this.chatrooms) {
                    if (room.users.length === 1 && !room.roomfull && !room.secret) {
                        room.users.push(socketID);
                        room.roomfull = true;
                        socket.join(roomname);
                        $redis.set(joinParams.session, roomname);
                        let roomStatus = {
                            ready: true,
                            users: [...room.users, joinParams.session],
                            text: []
                        }
                        $redis.set(roomname, JSON.stringify(roomStatus));
                        
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
                        room.users.push(socketID);
                        room.roomfull = true;
                        socket.join(roomname);
                        $redis.set(joinParams.session, roomname);
                        let roomStatus = {
                            ready: true,
                            users: [...room.users, joinParams.session],
                            text: []
                        }
                        $redis.set(roomname, JSON.stringify(roomStatus));

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
                const newRoomName = joinParams.secretcode !== '' ? joinParams.secretcode : uuidv4();
                this.chatrooms.set(newRoomName, {
                    secret: joinParams.secretcode !== '' ? true : false,
                    roomfull: false,
                    users: [joinParams.session]
                })
                socket.join(newRoomName);
                $redis.set(joinParams.session, newRoomName);
                let roomStatus = {
                    ready: false,
                    users: [joinParams.session],
                    text: []
                }
                $redis.set(newRoomName, JSON.stringify(roomStatus));

                socket.emit('joinedRoom', { text: '等待對方加入', ready: false });
            }
            else {

            }
        }

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
        message: any)
    : Promise<void> {
        for (let [roomname, room] of this.chatrooms) {
            if (room.users.includes(socket.id)) {
                console.log(`from: ${message.id}, to: ${roomname}, msg: ${message}`)
                let params = {
                    text: message.msg,
                    id: message.id
                }
                socket.broadcast.to(roomname).emit('getMessage', params);

                let chatHistory = await $redis.get(roomname).catch((err: any) => console.log(`sendMessage(), $redis.getHistory err: `, err) );
                chatHistory = chatHistory === null ? [] : JSON.parse(chatHistory);
                chatHistory.push(params);
                $redis.set(roomname, JSON.stringify(chatHistory));

                console.log(`setnMessage() chatHistory:\nroom: ${roomname}\n`, await $redis.get(roomname));
                break;
            }
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
        console.log(`\nsocket.id: ${JSON.stringify(socket.id)}`);
        let found = false;
        let userSession = await $redis.get(socket.id)
        // console.log(`userSession: ${userSession}`);
        let userRoom = await $redis.get(userSession);
        // console.log(`userRoom: ${userRoom}`);
        let chatHistory = await $redis.get(userRoom);
        // console.log(`chatHistory: ${chatHistory}`);

        for (let [roomname, room] of this.chatrooms) {
            
            const idx = room.users.indexOf(userSession);

            if (idx !== -1) {
            // if (room.users.includes(socket.id)) {
                // room.users.splice(room.users.indexOf(socket.id), 1);
                room.users.splice(idx, 1);
                if (room.users.length === 0) {
                    this.chatrooms.delete(roomname);
                    $redis.del(userRoom);
                    $redis.del(userSession);
                    $redis.del(socket.id);
                }
                socket.broadcast.to(roomname).emit('userDisconnect', '對方已經離開');
                found = true;
                break;
            }
        }
        if (!found) {
            console.log(`未找到user:[${userSession.id}]的房間`);
        }
    }
}

//module.exports = WebSocketServer;
export default WebSocketServer;
