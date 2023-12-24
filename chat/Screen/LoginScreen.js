import { KeyboardAvoidingView, StyleSheet, Text, View } from 'react-native'
import { Button,Input } from '@rneui/base'
import React from 'react'

const LoginScreen = ({ navigation }) => {
  return (
    <KeyboardAvoidingView>
      <Button onPress={() => navigation.navigate('Chat')} title='開始聊天' />
    </KeyboardAvoidingView>
  )
}

export default LoginScreen

const styles = StyleSheet.create({})