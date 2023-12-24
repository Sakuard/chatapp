import io from 'socket.io-client';

export default function Socket() {
    const socket = io('http://localhost:3100');
    socket.on('connected', () => {
        console.log(`webSocket is connected: ${socket.id}`)
    })
}