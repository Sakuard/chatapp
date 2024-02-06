
# RN + Express.js Technology and Problem Solving

This project combines React-Native and Express.js for a chat application. Key technologies:

1. **WebSocket for Real-Time Chat**: Enables instant messaging.
2. **OOP in Backend**: WebSocket code is packed up as class-based for scalability.
3. **Dockerization of Backend**: Backend packaged as Docker image.
4. **React-Native for Cross-Platform**: Ensures cross-platform functionality.

# React-Native Expo with Express.js Chat App Development Progress

## React-Native Setup
1. Install dependencies:
```bash
yarn install
# or
npm i
```
2. Update `.env` and `esmConfig.js` configurations.
3. Set up `app.config` for Expo.dev:
```json
{
   ...
   "eas": {
      "projectId": "your-projectId-here"
   }
   ...
}
```
OR Generate with eas-cli:
```bash
npm i -g eas-cli
# replace projname to your project you want to connect to Expo.dev
npx create-expo-app 'projname'
cd 'projname'
# replace the following id to your own proj your create on Expo.dev
eas init --id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```
4. Start the server:
```bash
npx expo start
```

## Express.js Setup
1. Install dependencies.
```bash
yarn install
# or
npm i
```
2. Rename key and certificate files(@/cert).
3. Update `.env` configuration.
4. Start the server:
```bash
yarn dev
# or 
npm run dev
```

### Dockerizing Express.js
1. Install Docker.
2. Navigate to the server directory.
3. Build and run Docker image:
```bash
docker build -t chatapp-server .
docker run -t -p 3100:3100 chatapp-server
```

## React-Native Expo (RN Expo)
- ✅ **Start Page**: Only a "Start Chat" button.
- ✅ **Chat Message Page**: Text box, button, and chat area.
- ✅ **WebSocket Functions**
- 🚫 **SSL for WebSocket**
- 🔘 **CSS layout**
- ✅ **Dockerization**
- **2024/01**
- ✅ **Secret Code Feature (for specific room match)**

## Express.js
- ✅ **WebSocket Server**
- ✅ **Communication Functions**
- ✅ **Random Pairing Mechanism**
- ✅ **SSL for WebSocket (using HTTP for now)**
- ✅ **Dockerization**
- **2024/01**
- ✅ **Secret Code Feature (for specific room match)**
- ✅ **restructure socket related code into typescript class Object**
- 🔘 **Redis Cache for Secret Code Feature's Room Cache**

## Status Legend
- ✅ Completed
- ❌ Not Started
- 🔘 Partially Completed
- 🚫 Planned but Terminated
