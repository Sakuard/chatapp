# ChatApp Client
# 第一階段：構建階段
FROM node:20.11.0-alpine3.19 as builder
WORKDIR /usr/src/app/client
# 安裝依賴
COPY package.json ./
RUN npm i --unsafe-perm --allow-root -g npm@latest expo-cli@latest
RUN yarn install
# 複製源代碼
COPY . .

# 第二階段：運行階段
FROM node:20.11.0-alpine3.19
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
ARG PORT=19006
ENV PORT $PORT
EXPOSE $PORT 19001 19002
# 從構建階段複製檔案
COPY --from=builder /usr/src/app/client /usr/src/app/client
WORKDIR /usr/src/app/client
ENV PATH /usr/src/app/client/.bin:$PATH
ENTRYPOINT ["npx", "expo"]
CMD ["start", "--web"]
