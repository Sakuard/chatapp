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
     * @param {string} sessionID - UserID
     * @param {string} secretCode - secret code
     * @param {Function} setChatReady - react state function
     * @param {Function} setIsConnected - react state function
     * @param {Function} setMessages - react state function
     * @param {Function} setIsSecretFull - react state function
     */
    connect(sessionID, secretCode, setChatReady, setIsConnected, setMessages, setIsSecretFull) {
        // here, i want to add a localstorage for 
        console.log(`passed in ID: ${sessionID}`)
        this.socket.on('connected', () => {
            // this.socket.emit('joinRoom', this.socket.id);
            let joinParams = this.paramsGen(this.socket.id, secretCode, sessionID);
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
            if (chatMsg.length > 0) {
                for (const msg of chatMsg) {
                    setMessages(prevMessages => [...prevMessages, { msg: msg.msg, session: msg.session}])
                }
                setMessages(chatMsg);
            }

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
            setMessages(prevMessages => [...prevMessages, { msg: message.msg, session:message.session, received: true }]);
        });

        this.socket.on('userDisconnect', message => {
            console.log(`userDisconnect: `, message)
            setMessages(prevMessages => [...prevMessages, { msg: message.msg, session: message.session, received: true }]);
            setIsConnected(false);
            localStorage.removeItem('TECHPORN_CHAT_ACTIVE');
        });

        this.socket.on('test', data => {
            console.log(`test data: `, data)
        })

        this.socket.on('joinedRoomFull', text => {
            alert(`密語房: ${secretCode} 已滿員`)
            setIsSecretFull(true);
        })
    }

    disconnect(sessionid) {
        // this.socket.disconnect();
        console.log(`leave session: `, sessionid)
        this.socket.emit('leave', sessionid);
    }

    sendMessage(message, session) {
        let msgParams = {
            session: session,
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
