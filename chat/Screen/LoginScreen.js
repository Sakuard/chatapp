import { KeyboardAvoidingView, StyleSheet, Text, View, TouchableOpacity  } from 'react-native'
import { Button,Input } from '@rneui/base'
import React, { useEffect, useState } from 'react'

import { BG_COLOR, BTN_COLOR, BTN_CAPTION, INPUT_BG_COLOR, INPUT_COLOR } from '../esmConfig';
import * as S from '../src/styled';

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
    <>
    <S.Background>

      {/* <KeyboardAvoidingView style={styles.container} > */}
      <KeyboardAvoidingView style={S.HomeContainer} >
          <Input
            inputContainerStyle={styles.input}
            value={secretCode}
            onChangeText={text => setSecretCode(text)}
            placeholder='請輸入密語' />
          {/* <Button
            style={styles.button}
            onPress={() => {
              if (secretCode === '') {
                alert('請輸入密語');
                return;
              }
              join(secretCode);
            }}
            title='使用密語' /> */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              if (secretCode === '') {
                alert('請輸入密語');
                return;
              }
              join(secretCode);
            }}>
              <Text style={styles.buttonCaption}>使用密語</Text>
          </TouchableOpacity>
          {/* <Button
            style={styles.button}
            onPress={() => {
              join(secretCode);
            }}
            title='開始聊天' /> */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              join(secretCode);
            }}>
              <Text style={styles.buttonCaption}>開始聊天</Text>
          </TouchableOpacity>
      </KeyboardAvoidingView>
    </S.Background>
    </>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: BG_COLOR,
    justifyContent: 'center',
    height: '100%',
  },
  button: {
    margin: 5,
    width: 170,
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
  },
  input: {
    width: 250,
    alignSelf: 'center',
    borderColor: INPUT_COLOR,
    padding: 5,
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: INPUT_BG_COLOR,
  }
})