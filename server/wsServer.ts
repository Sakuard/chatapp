const socketIO = require('socket.io');
const { Socket} = require('socket.io');
const {http,Server} = require('http');
const { v4: uuidv4 } = require('uuid');
const memory = process.memoryUsage();
require('dotenv').config()
const $config = process.env

let $io;
interface ChatRoomSecret {
    roomname: string,
    members: string[],
    roomfull: boolean,
    secretcode: string,
    chatHistory: any[]

}
interface ChatRoomRandom {
    roomname: string,
    members: string[],
    roomfull: boolean,
    chatHistory: any[]

}
interface ChatCacheUsers {
    socketid: string
    sessionid: string,
}
interface ChatCache {
    sessions: any[];
    chatrooms: {
        random: ChatRoomRandom[],
        secret: ChatRoomSecret[]
    };
    users: any[];
    sockets: ChatCacheUsers[];
    USERS: Map<string, any>
}
let $cache:ChatCache = {
    sessions: [],
    chatrooms: {
        random: [
        ],
        secret: [
        ]
    },
    users: [],
    sockets: [],
    USERS: new Map()
};
module.exports = {
    initSocket: (httpServer: typeof Server, opts: any) => {
        $io = socketIO(httpServer, {
            cors: {
                origin: opts.origin,
                path: '/websocket'
            }
        });

        $io.on('connection', (socket: typeof Socket) => {
            socket.emit('/user/connected', `${socket.id}`)

            socket.on('/user/join', (joinParams: {socketid: string, session: string, secretcode: string}) => {
                joinRoom(socket, joinParams)
            })
        })

    }
}

function joinRoom(socket: typeof Socket, joinParams: {socketid: string, session: string, secretcode: string}) {
    const { socketid, session, secretcode } = joinParams;

    // setSocketCache(socketid, session).status==='NG'
    // ? socket.emit('/warning', JSON.stringify({status: 'NG', msg: 'Error, please try again'}))
    // : '';
    let response = setSocketCache(socketid, session)
    response.status==='NG'
    ? socket.emit('/warning', JSON.stringify({status: 'NG', msg: 'Error, please try again'}))
    : '';

    if (response.status==='OK' && response.roomname) {
        try {
            socket.join(response.roomname);
            socket.to(response.roomname).emit('/user/joined', {text: '對方已經加入', ready: true})
        } catch (err) {
            console.log(err)
        }
    }

    let joinedRoom = false;
    for (const user of $cache.users) {
        if (user.sessionid === session) {
            socket.join(user.roomname)
            if (user.sockets.indexOf(socketid)===-1) user.sockets.push(socketid)
        }
    }
    let joined = false;
    if (secretcode === '') {
        for (const room of $cache.chatrooms.random) {
            if (!room.roomfull) {
                room.roomfull = true;
                room.members.push(session)
                $cache.users.push({sessionid: session, roomname: room.roomname, sockets: [socketid]})
                socket.join(room.roomname)
                socket.to(room.roomname).emit('/user/joined', {text: '對方已經加入', ready: true})
                joined = true;
                break;
            }
        }
        if (!joined) {
            let roomname = uuidv4();
            let params = {
                type: 'random',
                roomname: roomname,
                session: session,
                roomfull: false,
                socketid: socketid
            }
            // $cache.chatrooms.random.push({roomname: roomname, members: [session], roomfull: false})
            // $cache.users.push({sessionid: session, roomname: roomname});
            dataCache(params)
            socket.join(roomname)
            socket.to(roomname).emit('/user/joined', {text: '等待對方加入', ready: false})
        }
    }
    else if (secretcode !== '' && secretcode !== null && secretcode !== undefined) {
        for (const room of $cache.chatrooms.secret) {
            if (room.secretcode && !room.roomfull) {
                room.roomfull = true;
                room.members.push(session);
                $cache.users.push({sessionid: session, roomname: room.roomname});
                socket.join(room.roomname);
                socket.to(room.roomname).emit('/user/joined', {text: '對方已經加入', ready: true})
                joined = true;
                break;
            }
        }
        if (!joined) {
            let roomname = uuidv4();
            let params = {
                type: 'secret',
                roomname: roomname,
                session: session,
                roomfull: false,
                secretcode: secretcode,
                socketid: socketid
            }
            // $cache.chatrooms.secret.push({roomname: roomname, members: [session], roomfull: false, secretcode: secretcode})
            // $cache.users.push({sessionid: session, roomname: roomname});
            dataCache(params)
            socket.join(roomname)
            socket.to(roomname).emit('/user/joined', {text: '等待對方加入', ready: false})
        }
    }
}

function dataCache(params:any) {
    switch(params.type) {
        case 'random':
            $cache.chatrooms.random.push(
                {
                    roomname: params.roomname,
                    members: [params.session],
                    roomfull: params.roomfull,
                    chatHistory: []
                })
            $cache.users.push(
                {
                    sessionid: params.session,
                    roomname: params.roomname,
                    sockets: [params.socketid]
                })
            break;
        case 'secret':
            $cache.chatrooms.secret.push(
                {
                    roomname: params.roomname,
                    members: [params.session],
                    roomfull: params.roomfull,
                    secretcode: params.secretcode,
                    chatHistory: []
                })
            $cache.users.push(
                {
                    sessionid: params.session,
                    roomname: params.roomname,
                    sockets: [params.socketid]
                })
            break;

    }
}

function setSocketCache(socketid: string, session: string) {

    try {
        const [sockets, chatroom] = $cache.USERS.get(session)
        if (chatroom !== '') {
            return { status: 'OK', roomname: chatroom }
        } else {
            let params = {
                sockets: [socketid],
                chatroom: '',
            }
            $cache.USERS.set(session, params)
            return { status: 'OK'}
        }
    } catch (err:any) {
        return { status: 'NG', msg: err.message }
    }

}