import * as React from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import styled from 'styled-components/native';

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
}

const Background = styled.View`
    flex: 1;
    background: 
        radial-gradient(
            30.97% 85.07% at 76.84% 37.7%,
            #1C3131 0%, 
            rgba(33, 65, 65, 0) 100%
        ), 
        radial-gradient(
            47.85% 46.43% at 10.14% -10.99%, 
            #1B2916 0%, 
            rgba(43, 62, 36, 0) 100%
        ), 
        radial-gradient(
            36.9% 48.16% at 28.58% 44.54%,
            #18271F 0%,
            rgba(27, 46, 35, 0) 100%
        ), 
        #000000;
`;

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
                            title:'離開'
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
