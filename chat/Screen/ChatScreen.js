// @ts-check
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Dimensions, TextInput, Alert, BackHandler, Modal, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Input } from '@rneui/base';
import { v4 as uuidv4 } from 'uuid';

import SocketClient from '../socketClient';
// import { useAuth } from '../context/AuthContext';

import { CHAT_BGN, BTN_COLOR, BTN_CAPTION } from '../esmConfig';
import * as S from '../src/styled.js';


const ChatScreen = ({ navigation, route }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [chatReady, setChatReady] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [isSecretFull, setIsSecretFull] = useState(false);
    const [chatSession, setChatSession] = useState('');
    const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
    const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
    const [useKeyin, setUseKeyin] = useState(false);

    const [backDialog, setBackDialog] = useState(false);
    const [doGoback, setDoGoback] =useState(false)
    const [keyin, setKeyin] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    // const screenWidth = Dimensions.get('window').width;
    
    const socketClientRef = useRef(null);
    const scrollRef = useRef();

    localStorage.setItem('TECHPORN_CHAT_ACTIVE', true);
    useEffect(() => {
        if (!doGoback && chatReady) {
            const unsubscribe = navigation.addListener('beforeRemove', (e) => {
                setBackDialog(true);
                e.preventDefault();
            });
            return unsubscribe;
        } else if (doGoback) {
            navigation.goBack();
            setDoGoback(false);
        } else {
        }

    }, [doGoback,navigation,chatReady])

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
        socketClientRef.current.connect(session, secretCode, setChatReady, setIsConnected, setMessages, setIsSecretFull, setUseKeyin);
        
        const onChange = () => {
            const width = Dimensions.get('window').width;
            const height = Dimensions.get('window').height;
            setScreenWidth(width);
            setScreenHeight(height);
        }
        Dimensions.addEventListener('change', onChange);

        setInterval(() => {
            setTickCnt(pre => (pre%3)+1)
        }, 1000)

        return() => {
            socketClientRef.current.disconnect(session);
            localStorage.removeItem('TECHPORN_CHAT_ACTIVE');
            Dimensions.removeEventListener('change', onChange);
        }
    },[])
    useEffect(() => {
        if (isSecretFull) {
            navigation.goBack();
        }
    },[isSecretFull])
    useEffect(() => {
        scrollRef.current.scrollToEnd({ animated: true });
    }, [messages])
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
        if (keyin && message !== '') {
            // console.log(`already keying`)
        }
        if (message !== '' && !keyin) {
            setKeyin(true);
            socketClientRef.current.keyin(session)
            // console.log(`key in`)
        }
        if (message === '') {
            setKeyin(false);
            socketClientRef.current.keyout(session)
            // console.log(`key out`)
        }

    },[message,keyin])
    const fadeIn = () => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true
        }).start();
    }
    const fadeOut = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true
        }).start();
    }
    useEffect(() => {
        useKeyin ? fadeIn() : fadeOut()
    }, [useKeyin])

    const renderTicks = () => {
        switch (tickCnt) {
            case 1:
                return '.';
            case 2:
                return '. .';
            case 3:
                return '. . .';
            default:
                return '';
        }
    }
    

    const sendMessage = () => {
        if (message === '') {
            return;
        }
        setKeyin(false);
        if (socketClientRef.current) {
            socketClientRef.current.sendMessage(message, chatSession);
            setMessages(prevMessages => [...prevMessages, { msg: message, session: chatSession, received: false }]);
            setMessage('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            sendMessage();
            e.preventDefault();
        }
    }

    
    if (isSecretFull) {
        return (
            <View style={styles.container}>
                <Text>聊天室已滿</Text>
            </View>
        );
    }
    if (!chatReady) {
        return (
            <>
                <S.Background>
                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}>
                        <S.TextContainer>配對中</S.TextContainer>
                        <S.TextContainer>{renderTicks()}</S.TextContainer>
                        {/* <S.TextContainer>...</S.TextContainer> */}
                    </View>
                </S.Background>
            </>
        );
    }

    return (
        <>
            <Modal
                animationType="slide"
                transparent={true}
                visible={backDialog}
                onRequestClose={() => {
                    setBackDialog(false);
                }}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>您確定要離開聊天室嗎?</Text>
                        <View style={{display:'flex',flexDirection:'row'}}>
                            <Button
                                color={'#285a4d'}
                                style={styles.modalBtn}
                                onPress={() => {
                                    setBackDialog(false);
                                }}
                                title="取消"
                                />
                            <Button
                                color={'#285a4d'}
                                style={styles.modalBtn}
                                onPress={() => {
                                    setBackDialog(false);
                                    navigation.goBack();
                                    setDoGoback(true);
                                }}
                                title="確定"
                            />
                        </View>
                    </View>
                </View>
            </Modal>


            <S.Background>
                {/* <View style={styles.container}> */}
                <View>
                    {/* <ScrollView style={styles.scrollView}> */}
                    <S.MessageContainer>
                        {/* <ScrollView style={{ flex: 1,height: '82vh' }}> */}
                        <ScrollView ref={scrollRef} style={{ flex: 1,height: '82vh' }}>
                            {messages.map((msg, idx) => (
                                <View key={idx} style={[styles.messageBox, msg.session !== chatSession ? styles.leftMessage : styles.rightMessage]}>
                                    <Text>{msg.msg}</Text>
                                </View>
                            ))}
                        </ScrollView>
                        {/* {!useKeyin && <p style={{height: '0px'}}></p> } */}
                        <Animated.View style={{opacity: fadeAnim}}>
                            {
                                useKeyin
                                ? <View><Text style={{backgroundColor:'#87a578', padding: 5, marginLeft: 15, marginBottom: 5, width: 120, borderRadius: 5}}>對方正在輸入...</Text></View>
                                : <p style={{height: '13px', marginBottom: 5}}></p>
                            }
                        </Animated.View>
                        <View style={[styles.inputContainer, screenWidth < 325 ? { flexDirection: 'column' } : { flexDirection: 'row' }]}>

                            <div>
                                {/* <Input */}
                                <TextInput
                                    style={[styles.inputField, screenWidth < 325 ? { width: '100%', flex: undefined } : { flex: 1, width: screenWidth-100 }]}
                                    placeholder='請輸入訊息'
                                    multiline={true}
                                    value={message}
                                    onChangeText={text => setMessage(text)}
                                    onKeyPress={handleKeyDown}
                                    editable={isConnected}
                                />
                            </div>
                            <TouchableOpacity
                                style={[styles.button, screenWidth > 325 ? { width: 60, marginLeft: 10 } : screenWidth > 250 ? { width: 230, margin: "10 10" } : { width: 180, margin: "10 10" } ]}
                                onPress={sendMessage}
                                disabled={!isConnected}>
                                <Text style={styles.buttonCaption}>送出</Text>
                            </TouchableOpacity>
                        </View>

                    </S.MessageContainer>
                </View>
            </KeyboardAvoidingView>
        </>
    );
};

export default ChatScreen;

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
    },
    modalView: {
        margin: 20,
        backgroundColor: "#999",
        borderRadius: 5,
        paddingTop:10,
        paddingHorizontal: 10,
        paddingBottom: 5,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalText: {
        marginBottom: 5,
        textAlign: "center",
        fontSize: 20,
        fontWeight: 'bold',
        color: '#444'
    },
    modalBtn: {
        borderRadius: 100,
        marginTop: 5,
        marginBottom: 5,
        marginHorizontal: 5,
        width: 80,
    },
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: CHAT_BGN,
    },
    scrollView: {
        flex: 1,
    },
    messageBox: {
        maxWidth: '80%',
        marginVertical: 5,
        padding: 10,
        borderRadius: 5,
    },
    leftMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#888',
        marginLeft: 10,
    },
    rightMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#87a578',
        marginRight: 10,
    },
    inputContainer: {
        // flexDirection: screenWidth < 325 ? 'column' : 'row',
        alignItems: 'center',
        flexWrap: 'nowrap', // 防止換行
    },
    inputField: {
        backgroundColor: '#666',
        borderRadius: 5,
        padding: 10,
        marginLeft: 10,
        // width: screenWidth < 325 ? '100%' : undefined,
        // flex: screenWidth < 325 ? undefined : 1
    },
    button: {
        // minWidth: screenWidth < 325 ? '100%' : '60px',
        backgroundColor: BTN_COLOR,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        marginLeft: 10, // 添加左邊距以防止超出
        marginBottom: 5
    },
    buttonCaption: {
      color: BTN_CAPTION,
      fontSize: 17,
      fontWeight: 'bold'
    }
});
