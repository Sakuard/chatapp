import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Input } from '@rneui/base';

import SocketClient from '../socketClient';

const ChatScreen = ({ navigation }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [chatReady, setChatReady] = useState(true);
    const [isConnected, setIsConnected] = useState(false);

    // const socketClient = new SocketClient();
    const socketClientRef = useRef(null);


    useLayoutEffect(() => {
        navigation.setOptions({
            headerBackTitle: '離開聊天室'
        });
    }, [navigation]);

    useEffect(() => {
        if (!socketClientRef.current) {
            socketClientRef.current = new SocketClient();
            socketClientRef.current.connect(setChatReady, setIsConnected, setMessages);
        }

        return () => {
            socketClientRef.current.disconnect();
        };
    }, []);

    const sendMessage = () => {
        if (socketClientRef.current) {
            socketClientRef.current.sendMessage(message);
            setMessages(prevMessages => [...prevMessages, { text: message, received: false }]);
            setMessage('');
        }
    };

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
                    <View key={idx} style={[styles.messageBox, msg.received ? styles.leftMessage : styles.rightMessage]}>
                        <Text>{msg.text}</Text>
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
