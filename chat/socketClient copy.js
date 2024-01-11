// @ts-check
// SocketClient.js
import io from 'socket.io-client';
import { socketURL } from './esmConfig';

class SocketClient {

    /**
     * Constructs a SocketClient.
     */
    constructor() {
        this.socket = io(socketURL, { transports: ['websocket'] });
    }

    /**
     * @param {string} secretCode - secret code
     * @param {Function} setChatReady - react state function
     * @param {Function} setIsConnected - react state function
     * @param {Function} setMessages - react state function
     */
    connect(secretCode, setChatReady, setIsConnected, setMessages) {
        if (secretCode === '') {
            this.socket.on('connected', () => {
                this.socket.emit('joinRoom', this.socket.id);
            });
        }

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
