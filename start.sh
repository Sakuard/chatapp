#!/bin/sh

# 启动 chat-server
cd /usr/src/app/server
echo "Starting chat-server..."
PORT=4100 node index.js &

# 等待chat-server启动
echo "Waiting for chat-server to start..."
sleep 5

# 启动 chat-app
cd /usr/src/app/chat
echo "Building and starting chat-app..."
expo build:web
npx serve web-build -p 19006 &

# 等待chat-app构建并启动
echo "Waiting for chat-app to build and start..."
sleep 10

# 启动 nginx
echo "Starting Nginx..."
nginx -g 'daemon off;'
