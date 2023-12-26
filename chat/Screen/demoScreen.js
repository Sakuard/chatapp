import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Input } from '@rneui/base';

import io from 'socket.io-client';
import { socketURL } from '../esmConfig';

let socket = null;

const ChatScreen = ({ navigation }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        socket = io(socketURL);
        socket.on('connected', () => {
            // console.log(`webSocket is connected: ${socket.id}`);
            socket.emit('joinRoom', socket.id);
        });

        socket.on('joinedRoom', room => {
            // console.log(`joinedRoom: ${room}`);
        });

        socket.on('getMessage', message => {
            // console.log(message);
            setMessages(prevMessages => [...prevMessages, { text: message, received: true }]);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const sendMessage = () => {
        // console.log(`sendMessage: ${message}`);
        socket.emit('sendMessage', message);
        setMessages(prevMessages => [...prevMessages, { text: message, received: false }]);
        setMessage('');
    };

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
            />
            <Button onPress={sendMessage} title='送出' />
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
