import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Button, Input } from '@rneui/base';
import { v4 as uuidv4 } from 'uuid';

import SocketClient from '../socketClient';
// import { useAuth } from '../context/AuthContext';

import { BG_COLOR, CHAT_BGN, BTN_COLOR, BTN_CAPTION } from '../esmConfig';

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
            session = localStorage.getItem('TECHPORN_CHAT_USER');    
        }
        else {
            setChatSession(localStorage.getItem('TECHPORN_CHAT_USER'));
            session = localStorage.getItem('TECHPORN_CHAT_USER');
        }
        let secretCode = route.params.secretCode
        socketClientRef.current = new SocketClient();
        if (secretCode === null || secretCode === undefined) {
            secretCode = '';
        }
        socketClientRef.current.connect(session, secretCode, setChatReady, setIsConnected, setMessages, setIsSecretFull);
        return() => {
            socketClientRef.current.disconnect(session);
            localStorage.removeItem('TECHPORN_CHAT_ACTIVE');
        }
    },[])
    useEffect(() => {
        if (isSecretFull) {
            navigation.goBack();
        }
    },[isSecretFull])
    

    const sendMessage = () => {
        if (socketClientRef.current) {
            socketClientRef.current.sendMessage(message, chatSession);
            setMessages(prevMessages => [...prevMessages, { msg: message, session: chatSession, received: false }]);
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
            {/* <View style={styles.inputContainer}> */}
                <Input
                    placeholder='plz text up'
                    value={message}
                    onChangeText={text => setMessage(text)}
                    editable={isConnected}
                />
                {/* <Button onPress={sendMessage} disabled={!isConnected} title='送出' /> */}
                <TouchableOpacity
                    style={styles.button}
                    onPress={sendMessage}
                    disabled={!isConnected}>
                    <Text style={styles.buttonCaption}>送出</Text>
                </TouchableOpacity>
            {/* </View> */}
        </View>
    );
};

export default ChatScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        // backgroundColor: '#ddd',
        backgroundColor: CHAT_BGN,
    },
    scrollView: {
        flex: 1,
    },
    messageBox: {
        maxWidth: '80%',
        marginVertical: 5,
        padding: 10,
        borderWidth: 1,
        borderRadius: 5,
    },
    leftMessage: {
        alignSelf: 'flex-start',
        borderColor: '#888',
        backgroundColor: '#888',
    },
    rightMessage: {
        alignSelf: 'flex-end',
        borderColor: '#aaa',
        backgroundColor: '#aaa',
    },
    button: {
      margin: 5,
      width: '80%',
      alignSelf: 'center',
      backgroundColor: BTN_COLOR,
      padding: 10,
      alignItems: 'center',
      borderRadius: 10,
    },
    buttonCaption: {
      color: BTN_CAPTION,
      fontSize: 17,
      fontWeight: 'bold'
    }
});
