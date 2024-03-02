#!/bin/sh
# 啟動 chat-server
cd /usr/src/app/server
PORT=4100 node index.js &

# 啟動 chat-app
cd /usr/src/app/chat
PORT=19006 npx expo start --web
