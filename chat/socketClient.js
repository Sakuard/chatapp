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
     * @param {Function} setIsSecretFull - react state function
     */
    connect(secretCode, setChatReady, setIsConnected, setMessages, setIsSecretFull) {
        if (secretCode === '') {
            this.socket.on('connected', () => {
                this.socket.emit('joinRoom', this.socket.id);
            });
        }
        else {
            this.socket.on('connected', () => {
                let joinParams = {
                    id: this.socket.id,
                    secretcode: secretCode
                }
                // alert(`joinRoom/v2: ${JSON.stringify(joinParams)}`)
                this.socket.emit('joinRoom/v2', joinParams);
            });
        }

        this.socket.on('joinedRoom', text => {
            setChatReady(text.ready);
            if (text.ready) {
                setIsConnected(true);
            }
            console.log(`joinedRoom: ${JSON.stringify(text)}`)
        });

        this.socket.on('getMessage', message => {
            setMessages(prevMessages => [...prevMessages, { text: message, received: true }]);
        });

        this.socket.on('userDisconnect', message => {
            setMessages(prevMessages => [...prevMessages, { text: message, received: true }]);
            setIsConnected(false);
        });

        this.socket.on('joinedRoomFull', text => {
            alert(`room: ${secretCode} is full`)
            setIsSecretFull(true);
        })
    }

    disconnect() {
        this.socket.disconnect();
    }

    sendMessage(message) {
        this.socket.emit('sendMessage', message);
    }
}

export default SocketClient;
