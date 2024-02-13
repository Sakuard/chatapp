import { KeyboardAvoidingView, StyleSheet, Text, View } from 'react-native'
import { Button,Input } from '@rneui/base'
import React, { useEffect, useState } from 'react'

const LoginScreen = ({ navigation }) => {
  
  const [secretCode, setSecretCode] = useState('')
  
  useEffect(() => {
    let chatActive = localStorage.getItem('TECHPORN_CHAT_ACTIVE');
    if (chatActive) {
      navigation.navigate('Chat', {secretCode: ''});
    }
  }, [navigation])
  
  const join = (secretCode) => {
    navigation.navigate('Chat', {secretCode});
    setSecretCode('');
  }

  return (
    <KeyboardAvoidingView style={styles.container} >
      <Input
        inputContainerStyle={styles.input}
        value={secretCode}
        onChangeText={text => setSecretCode(text)}
        placeholder='請輸入密語' />
      <Button
        style={styles.button}
        onPress={() => {
          if (secretCode === '') {
            alert('請輸入密語');
            return;
          }
          join(secretCode);
          // navigation.navigate('Chat', {secretCode});
          // setSecretCode('');
        }}
        title='使用密語' />
      <Button
        style={styles.button}
        onPress={() => {
          join(secretCode);
          // navigation.navigate('Chat', {secretCode: ''});
        }}
        title='開始聊天' />
    </KeyboardAvoidingView>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  button: {
    margin: 5,
    width: 200,
    alignSelf: 'center',
  },
  input: {
    width: 250,
    alignSelf: 'center',
    borderColor: '#ddd',
    padding: 5,
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#eee',
  }
})