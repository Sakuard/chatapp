import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Input } from '@rneui/base';

import SocketClient from '../socketClient';

const ChatScreen = ({ navigation, route }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [chatReady, setChatReady] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [isSecretFull, setIsSecretFull] = useState(false);
    
    const socketClientRef = useRef(null);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerBackTitle: '離開聊天室'
        });
    }, [navigation]);

    useEffect(() => {
        let secretCode = route.params.secretCode
        socketClientRef.current = new SocketClient();
        if (secretCode === '') {
            socketClientRef.current.connect('', setChatReady, setIsConnected, setMessages);
        }
        else {
            // alert(`secretCode: ${secretCode}`)
            socketClientRef.current.connect(secretCode, setChatReady, setIsConnected, setMessages, setIsSecretFull);
        }
        return() => {
            socketClientRef.current.disconnect();
        }
    },[])
    useEffect(() => {
        if (isSecretFull) {
            navigation.goBack();
        }
    },[isSecretFull])
    

    const sendMessage = () => {
        if (socketClientRef.current) {
            socketClientRef.current.sendMessage(message);
            setMessages(prevMessages => [...prevMessages, { text: message, received: false }]);
            setMessage('');
        }
    };

    // if (isSecretFull) {
    //     return (
    //         <View style={styles.container}>
    //             <Text>聊天室已滿</Text>
    //         </View>
    //     );
    // }
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
