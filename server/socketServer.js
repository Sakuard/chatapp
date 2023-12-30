const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

class WebSocketServer {
    constructor(server, corsOptions) {
        this.io = new Server(server, { cors: corsOptions });
        this.chatrooms = new Map();
        this.setup();
    }

    setup() {
        this.io.on('connection', socket => {
            console.log(`${socket.id} connected`);
            socket.emit('connected', `${socket.id}`);

            socket.on('joinRoom', userid => this.joinRoom(socket, userid));
            socket.on('sendMessage', message => this.sendMessage(socket, message));
            socket.on('disconnect', () => this.disconnect(socket));
        });
    }

    joinRoom(socket, userid) {
        let joined = false;
        if (this.chatrooms.size === 0) {
            const roomname = uuidv4();
            this.chatrooms.set(roomname, {
                roomfull: false,
                users: [userid]
            });
            socket.join(roomname);
            socket.emit('joinedRoom', { text: '等待對方加入', ready: false });
        } else {
            for (let [roomname, room] of this.chatrooms) {
                if (room.users.length === 1 && !room.roomfull) {
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
                    roomfull: false,
                    users: [userid]
                });
                socket.join(newRoomName);
                socket.emit('joinedRoom', { text: '等待對方加入', ready: false });
            }
        }
    }
    
    sendMessage(socket, message) {
        for (let [roomname, room] of this.chatrooms) {
            if (room.users.includes(socket.id)) {
                socket.broadcast.to(roomname).emit('getMessage', message);
                break;
            }
        }
    }
    
    disconnect(socket) {
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

module.exports = WebSocketServer;
