# React-Native Expo with Express.js Chat App Development Progress

## React-Native Setup
1. Run
```bash
yarn install
# or
npm i
```
2. Rename `server.example.key` to `server.key`, `server.example.cert` to `server.cert`.
3. Rename `.env.example` to `.env` and `esmConfig.example.js` to `esmConfig.js`.
4. Rename `app.example.config` to `app.config` and replace the "projectId" value with your own `projectId` created in Expo.dev-, or use the following eas command to generate a `app.config` file of your own after you've create a proj in Expo.dev:
by replacing "projectId" in `app.config`
```json
  {
    ...
    "eas": {
      "projectId": "your-projectId-here"
    }
    ...
  }
```

command to generate `app.config`
```bash
npm i -g eas-cli
# replace projname to your project you want to connect to Expo.dev
npx create-expo-app 'projname'
cd 'projname'
# replace the following id to your own proj your create on Expo.dev
eas init --id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```
5. Start the server using the command
```bash
npx expo start
```

## Express.js setup
1. Run
```bash
yarn install
# or
npm i
```
2. Rename `server.example.key` to `server.key`, `server.example.cert` to `server.cert`.
3. Rename `.env.example` to `.env`.
4. Start the server using the command
```bash
yarn dev
# or 
npm run dev
```

## React-Native Expo (RN Expo)
- ✅ **Start Page**
  - Description: Page containing only one button "開始聊天" (Start Chat).
- ✅ **Chat Message Page**
  - Description: Page with a text box, a button, and a chat dialogue area.
  - Layout: Chat dialogue box at the top, followed by text box/button.
- ✅ **WebSocket Connection and Communication Functions**
- 🔘 **Implement SSL for WebSocket Protection**
- 🔘 **CSS layout**
- ❌ **Dockerize**

## Express.js
- ✅ **WebSocket Server Implementation**
- ✅ **Define Communication Functions**
- ✅ **Random Pairing Mechanism Setup**
- 🔘 **Implement SSL for WebSocket Protection**
- ❌ **Dockerize**

Status Legend:
- ✅ Completed
- ❌ Not Started
- 🔘 Partially Completed
