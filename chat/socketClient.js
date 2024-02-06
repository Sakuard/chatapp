// @ts-check
// SocketClient.js
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { socketURL } from './esmConfig';

class SocketClient {

    /**
     * Constructs a SocketClient.
     */
    constructor() {
        this.socket = io(socketURL, { transports: ['websocket'] });
    }

    /**
     * @param {string} id - UserID
     * @param {string} secretCode - secret code
     * @param {Function} setChatReady - react state function
     * @param {Function} setIsConnected - react state function
     * @param {Function} setMessages - react state function
     * @param {Function} setIsSecretFull - react state function
     */
    connect(id, secretCode, setChatReady, setIsConnected, setMessages, setIsSecretFull) {
        // here, i want to add a localstorage for 
        console.log(`passed in ID: ${id}`)
        this.socket.on('connected', () => {
            // this.socket.emit('joinRoom', this.socket.id);
            let joinParams = this.paramsGen(this.socket.id, secretCode, id);
            this.socket.emit('joinRoom/v2', joinParams);
        });

        this.socket.on('reJoin', data => {
            console.log(`reJoin: ,`, data)
            setChatReady(data.ready);
            if (data.ready) {
                setIsConnected(true);
            }
            let chatMsg = JSON.parse(data.text);
            console.log(`chatMsg from reJoin: `, chatMsg);
            if (chatMsg.text.length > 0)
                setMessages(chatMsg);
        })
        this.socket.on('joinedRoom', text => {
            setChatReady(text.ready);
            if (text.ready) {
                setIsConnected(true);
            }
            console.log(`joinedRoom: ${JSON.stringify(text)}`)
        });

        this.socket.on('getMessage', message => {
            console.log(`getMessage: `, message)
            setMessages(prevMessages => [...prevMessages, { text: message.text, id:message.id, received: true }]);
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

    sendMessage(message, session) {
        let msgParams = {
            id: session,
            msg: message
        }
        this.socket.emit('sendMessage', msgParams);
    }

    /**
     * 
     * @param {string} socketid 
     * @param {string} secretcode 
     * @returns 
     */
    paramsGen(socketid, secretcode, session) {
        return {
            id: socketid,
            session: session,
            secretcode: secretcode
        }

    }
}

export default SocketClient;
