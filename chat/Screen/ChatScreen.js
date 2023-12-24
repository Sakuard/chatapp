import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'

// import socket from '../socket/socket.js'
import io from 'socket.io-client';
import { Button, Input } from '@rneui/base';

let socket = null;
const socketConnection = () => {
    socket = io('http://localhost:3100');
    socket.on('connected', () => {
        console.log(`webSocket is connected: ${socket.id}`)
        socket.emit('joinRoom', socket.id)
        socket.on('joinedRoom', room => {
            console.log(`joinedRoom: ${room}`)
        })
    })
    socket.on('getMessage', message => {
        console.log(message)
    })
}
socketConnection()

const ChatScreen = ({ navigation }) => {
    const [message, setMessage] = useState('')
    const sendMessage = () => {
        socket.emit('sendMessage', message)
    }

    return (
        <View>
            <Text>ChatScreen</Text>
            <Input placeholder='plz text up' onChangeText={text => {setMessage(text)}} />
            {/* <Button onPress={() => socket.emit('sendMessage', message)} title='送出' /> */}
            <Button onPress={sendMessage} title='送出' />
        </View>
    )
}

export default ChatScreen

const styles = StyleSheet.create({})