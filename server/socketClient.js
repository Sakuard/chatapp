const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

class WebSocketServer {
    constructor(server, corsOptions) {
        this.io = new Server(server, { cors: corsOptions });
        this.chatrooms = [];
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
        if (this.chatrooms.length === 0) {
            this.chatrooms.push({
                roomfull: false,
                roomname: uuidv4(),
                users: [userid]
            });
            socket.join(this.chatrooms[0].roomname);
            socket.emit('joinedRoom', { text: '等待對方加入', ready: false });
        } else {
            for (let room of this.chatrooms) {
                if (room.users.length === 1 && !room.roomfull) {
                    room.users.push(userid);
                    room.roomfull = true;
                    socket.join(room.roomname);
                    this.io.to(room.roomname).emit('joinedRoom', { text: '對方已經加入', ready: true });
                    joined = true;
                    break;
                }
            }

            if (!joined) {
                const newRoom = {
                    roomfull: false,
                    roomname: uuidv4(),
                    users: [userid]
                };
                this.chatrooms.push(newRoom);
                socket.join(newRoom.roomname);
                socket.emit('joinedRoom', { text: '等待對方加入', ready: false });
            }
        }
        // console.log("chatRoom: \n",this.chatrooms);
    }
    
    sendMessage(socket, message) {
        const room = this.chatrooms.find(r => r.users.includes(socket.id));
        if (room) {
            socket.broadcast.to(room.roomname).emit('getMessage', message);
        }
    }
    
    disconnect(socket) {
        this.chatrooms.forEach((room, index) => {
            if (room.users.includes(socket.id)) {
                room.users.splice(room.users.indexOf(socket.id), 1);
                socket.broadcast.to(room.roomname).emit('userDisconnect', '對方已經離開');
                if (room.users.length === 0) {
                    this.chatrooms.splice(index, 1);
                }
            }
        });
        // console.log("chatRoom: \n",this.chatrooms);
    }
}

module.exports = WebSocketServer;