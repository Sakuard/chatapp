// SocketClient.js
import io from 'socket.io-client';
import { socketURL } from './esmConfig';

class SocketClient {
    constructor() {
        this.socket = io(socketURL, { transports: ['websocket'] });
    }

    connect(setChatReady, setIsConnected, setMessages) {
        this.socket.on('connected', () => {
            this.socket.emit('joinRoom', this.socket.id);
        });

        this.socket.on('joinedRoom', text => {
            setChatReady(text.ready);
            setIsConnected(true);
        });

        this.socket.on('getMessage', message => {
            setMessages(prevMessages => [...prevMessages, { text: message, received: true }]);
        });

        this.socket.on('userDisconnect', message => {
            setMessages(prevMessages => [...prevMessages, { text: message, received: true }]);
            setIsConnected(false);
        });
    }

    disconnect() {
        this.socket.disconnect();
    }

    sendMessage(message) {
        this.socket.emit('sendMessage', message);
    }
}

export default SocketClient;
