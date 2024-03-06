# 構建 chat-app 的階段
FROM node:20.11.0-alpine3.19 as chat-app-builder
WORKDIR /usr/src/app/chat
COPY chat/package.json .
RUN npm i --unsafe-perm --allow-root -g npm@latest expo-cli@latest && yarn install
# RUN npx expo build:web
COPY chat/ .

# 構建 chat-server 的階段
FROM node:18-alpine as chat-server-builder
WORKDIR /usr/src/app/server
COPY server/package*.json ./
RUN npm install && npm install -g typescript
COPY server/ .
RUN tsc

# 運行階段
FROM node:18-alpine
WORKDIR /usr/src/app

WORKDIR /usr/src/app/nginx
RUN mkdir -p /run/nginx
RUN apk update && apk add --no-cache nginx
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# 複製 chat-app 構建的文件
COPY --from=chat-app-builder /usr/src/app/chat /usr/src/app/chat
# 複製 chat-server 構建的文件
COPY --from=chat-server-builder /usr/src/app/server /usr/src/app/server

# 準備啟動腳本
COPY start.sh /usr/src/app/start.sh
RUN chmod +x /usr/src/app/start.sh

# 設置環境變量
ENV NODE_ENV production
ENV PORT 19006

# 開放端口
# EXPOSE 19000 19001 19002 19006 4100 80
EXPOSE 19006 4100 80

# 啟動服務
CMD ["/usr/src/app/start.sh"]
