import { KeyboardAvoidingView, StyleSheet, Text, View, TouchableOpacity  } from 'react-native'
import { Button,Input } from '@rneui/base'
import React, { useEffect, useRef, useState } from 'react'
import { Animated } from 'react-native';

import { BG_COLOR, BTN_COLOR, BTN_CAPTION, INPUT_BG_COLOR, INPUT_COLOR } from '../esmConfig';
import * as S from '../src/styled';

const LoginScreen = ({ navigation }) => {
  
  const [secretCode, setSecretCode] = useState('')
  const [useWords, setUseWords] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textTogglerAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    let chatActive = localStorage.getItem('TECHPORN_CHAT_ACTIVE');
    if (chatActive) {
      navigation.navigate('chatroom', {secretCode: ''});
    }
  }, [navigation])
  
  const join = (secretCode) => {
    navigation.navigate('chatroom', {secretCode});
    setSecretCode('');
  }

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true
    }).start();
  }
  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start();
  }
  useEffect(() => {
    useWords ? fadeIn() : fadeOut()
  }, [useWords])
  const toggleText = () => {
    Animated.timing(textTogglerAnim, {
       toValue: 0,
        duration: 150,
        useNativeDriver: true
    }).start(() => {
      setUseWords(!useWords);
      Animated.timing(textTogglerAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true
      }).start();
    })
  }

  return (
    <>
      <div>
          <title>程人頻道</title>
          <meta name="description" content="程人聊天室" ></meta>
        </div>
      <S.Background>

        <KeyboardAvoidingView style={S.HomeContainer} >
            <Animated.View style={{opacity: fadeAnim}}>
              {/* {!useWords && <h1 style={{height:'20px'}}></h1>} */}
              { useWords
                ? <Input inputContainerStyle={styles.input} value={secretCode} onChangeText={text => setSecretCode(text)} placeholder='請輸入密語' />
                : <h1 style={{height:'20px'}}></h1>
              }
            </Animated.View>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                if (useWords && secretCode === '') {
                  alert('請輸入密語');
                  return;
                }
                join(secretCode);
              }}>
                <Text style={styles.buttonCaption}>開始聊天</Text>
            </TouchableOpacity>

            {/* {!useWords && <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setUseWords(true);
              }}>
                <Text style={styles.buttonCaption}>使用暗號</Text>
            </TouchableOpacity>} */}
            {/* {useWords ?  <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setUseWords(false);
              }}>
                <Text style={styles.buttonCaption}>取消</Text>
            </TouchableOpacity> : <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setUseWords(true);
              }}>
                <Text style={styles.buttonCaption}>使用暗號</Text>
            </TouchableOpacity>} */}
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    // useWords ? setUseWords(false) : setUseWords(true);
                    toggleText();
                  }}>
                    <Animated.View style={{opacity: textTogglerAnim}}>
                        <Text style={styles.buttonCaption}>{ useWords ? '取消' : '使用暗號'}</Text>
                    </Animated.View>
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