import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Input } from '@rneui/base';
import { v4 as uuidv4 } from 'uuid';

import SocketClient from '../socketClient';
// import { useAuth } from '../context/AuthContext';

const ChatScreen = ({ navigation, route }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [chatReady, setChatReady] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [isSecretFull, setIsSecretFull] = useState(false);
    const [chatSession, setChatSession] = useState('');
    
    const socketClientRef = useRef(null);

    localStorage.setItem('TECHPORN_CHAT_ACTIVE', true);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerBackTitle: '離開聊天室'
        });
    }, [navigation]);

    useEffect(() => {
        let session;
        if (localStorage.getItem('TECHPORN_CHAT_USER') === null || localStorage.getItem('TECHPORN_CHAT_USER') === undefined || localStorage.getItem('TECHPORN_CHAT_USER') === '') {
            localStorage.setItem('TECHPORN_CHAT_USER', uuidv4());
            setChatSession(localStorage.getItem('TECHPORN_CHAT_USER'));
            // console.log(`chatSession: ${chatSession}`)
            session = localStorage.getItem('TECHPORN_CHAT_USER');    
        }
        else {
            // console.log(`session: `, localStorage.getItem('TECHPORN_CHAT_USER'))
            setChatSession(localStorage.getItem('TECHPORN_CHAT_USER'));
            session = localStorage.getItem('TECHPORN_CHAT_USER');
        }
        console.log(`chatSession: ${session}`)
        let secretCode = route.params.secretCode
        socketClientRef.current = new SocketClient();
        if (secretCode === null || secretCode === undefined) {
            secretCode = '';
        }
        socketClientRef.current.connect(session, secretCode, setChatReady, setIsConnected, setMessages, setIsSecretFull);
        return() => {
            socketClientRef.current.disconnect(session);
            console.log(`emit disconnect ${session}`)
            localStorage.removeItem('TECHPORN_CHAT_ACTIVE');
        }
    },[])
    // useEffect(() => {
    //     console.log(`chatSession <3: `, chatSession)
    // },[chatSession])
    useEffect(() => {
        if (isSecretFull) {
            navigation.goBack();
        }
    },[isSecretFull])
    

    const sendMessage = () => {
        if (socketClientRef.current) {
            console.log(`chatSession: `, chatSession);
            socketClientRef.current.sendMessage(message, chatSession);
            setMessages(prevMessages => [...prevMessages, { msg: message, session: chatSession, received: false }]);
            console.log(`message: `, message);
            setMessage('');
        }
    };

    if (isSecretFull) {
        return (
            <View style={styles.container}>
                <Text>聊天室已滿</Text>
            </View>
        );
    }
    if (!chatReady) {
        return (
            <View style={styles.container}>
                <Text>配對中...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {messages.map((msg, idx) => (
                    <View key={idx} style={[styles.messageBox, msg.session !== chatSession ? styles.leftMessage : styles.rightMessage]}>
                        <Text>{msg.msg}</Text>
                    </View>
                ))}
            </ScrollView>
            <Input
                placeholder='plz text up'
                value={message}
                onChangeText={text => setMessage(text)}
                editable={isConnected}
            />
            <Button onPress={sendMessage} disabled={!isConnected} title='送出' />
        </View>
    );
};

export default ChatScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    scrollView: {
        flex: 1,
    },
    messageBox: {
        maxWidth: '80%',
        marginVertical: 5,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
    },
    leftMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#e0e0e0',
    },
    rightMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#90caf9',
    },
});
