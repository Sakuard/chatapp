import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './Screen/LoginScreen';
import ChatScreen from './Screen/ChatScreen';
// import { AuthProvider } from './context/AuthContext';

import { TITLE_BG_COLOR } from './esmConfig';
import * as S from './src/styled.js'

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
        <NavigationContainer>
          <Stack.Navigator screenOptions={globalScreenOptions}>
            <Stack.Screen name='程人頻道' component={LoginScreen} />
            <Stack.Screen
              name='Chat'
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
