// @ts-check
import io from 'socket.io-client';
import { socketURL } from './esmConfig';
import sha256 from 'crypto-js/sha256';
import { v4 as uuidv4 } from 'uuid';

class SocketClient {

    /**
     * Constructs a SocketClient.
     */
    constructor() {
        this.socket = io(socketURL, { transports: ['websocket'] });
        this.socketid = '';
    }

    /**
     * @param {string} secretCode - secret code
     * @param {Function} setChatReady - react state function
     * @param {Function} setIsConnected - react state function
     * @param {Function} setMessages - react state function
     * @param {Function} setIsSecretFull - react state function
     */
    connect(secretCode, setChatReady, setIsConnected, setMessages, setIsSecretFull) {
        let techpornChatUser = localStorage.getItem('techpornChatUser')
        let id = '';
        if (techpornChatUser) {
            // id = techpornChatUser;
            id = uuidv4();
            this.socket.on('connected', () => {
                // let joinParams = this.paramGen(secretCode, this.socket.id);
                console.log(`emit reJoin`)
                let joinParams = this.paramGen(secretCode, id);
                // this.socket.emit('reJoin', joinParams);
                this.socket.emit('joinRoom/v2', joinParams);
            })
        }else {
            id = uuidv4();
            localStorage.setItem('techpornChatUser', id);
            this.socket.on('connected', () => {
                // let joinParams = this.paramGen(secretCode, this.socket.id);
                let joinParams = this.paramGen(secretCode, id);
                this.socket.emit('joinRoom/v2', joinParams);
            })
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
    paramGen(secretCode, socketid) {
        return {
            id: socketid,
            secretcode: secretCode !== '' ? sha256(secretCode).toString() : ''
        }
    }
}

export default SocketClient;
