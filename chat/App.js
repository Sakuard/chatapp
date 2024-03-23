import * as React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './Screen/LoginScreen';
import ChatScreen from './Screen/ChatScreen';
// import { AuthProvider } from './context/AuthContext';

import { TITLE_BG_COLOR } from './esmConfig';
import * as S from './src/styled.js'
import SEO from './src/components/SEOHead.js'

const Stack = createNativeStackNavigator();

// The following is to define Styles globally
const globalScreenOptions = {
  headerStyle: {backgroundColor: S.TITLE_BG_COLOR},
  headerTitleStyle: {color: 'white'},
  headerTintColor: 'white',
  // backgroundColor: '#32503c'
}

export default function App({navigation}) {

  return (
    // <AuthProvider>
    <>
        <SEO title='程人頻道 | 聊天室' description='程人頻道聊天室' url='https://techporn.io/' >
          <meta name='description' content='工程師Podcast' />
          <meta name='description' content='程人頻道聊天室' />
        </SEO>
        <NavigationContainer>
          <Stack.Navigator screenOptions={globalScreenOptions}>
            <Stack.Screen name='程人頻道 | 聊天室' component={LoginScreen} />
            <Stack.Screen
              name='chatroom'
              component={ChatScreen}
              options={{
                title:'程人聊天室'
              }}/>
          </Stack.Navigator>
        </NavigationContainer>
    </>
    // </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#32503c',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
