const { io } = require("socket.io-client");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const URL = process.env.URL || "http://localhost:4100";
// const URL = "https://imposing-quasar-341914-chat-backend-chat-app-uatywyr3ha-de.a.run.app/";
const MAX_CLIENTS = 6;
const POLLING_PERCENTAGE = 0.05;
let CLIENT_CREATION_INTERVAL_IN_MS = 20;
const EMIT_INTERVAL_IN_MS = 1000;

let clientCount = 0;
let lastReport = new Date().getTime();
let sendMsg = 0;
let receivedMsg = 0;
// 這邊要有兩個參數表示sendMsgTot在這個tick與上一個tick的差值
let sendMsgTotLast = 0;
let getMsgTotLast = 0;

let sendMsgTot = 0;
let getMsgTot = 0;
let packetsSinceLastReport = 0;

let start = new Date().getTime();

const createClient = () => {
  // for demonstration purposes, some clients stay stuck in HTTP long-polling
  const transports =
    Math.random() < POLLING_PERCENTAGE ? ["polling"] : ["polling", "websocket"];

  const socket = io(URL, {
    // transports,
    path: '/websocket'
  });



  const ID = uuidv4();
  socket.on('connected', () => {
    let joinParams = {
      id: socket.id,
      session: ID,
      secretcode: ''
    }
    socket.emit('joinRoom/v2', joinParams)
    setInterval(() => {
      sendMsg++;
      sendMsgTot++;
      socket.emit("sendMessage", {session: ID, msg: Math.random()});
    }, EMIT_INTERVAL_IN_MS);
  })


  socket.on("getMessage", () => {
    receivedMsg++;
    getMsgTot++;
    packetsSinceLastReport++;
  });

  socket.on("disconnect", (reason) => {
    console.log(`disconnect due to ${reason}`);
  });

  if (++clientCount < MAX_CLIENTS) {
    setTimeout(createClient, CLIENT_CREATION_INTERVAL_IN_MS);
  }
};

createClient();

const printReport = () => {
  const now = new Date().getTime();
  const durationSinceLastReport = (now - lastReport) / 1000;
  const msgGetPercentage = ((receivedMsg / sendMsg) * 100).toFixed(2);
  const totPercentage = ((getMsgTot / sendMsgTot) * 100).toFixed(2);
  
  let tickSend = sendMsgTot - sendMsgTotLast;
  let tickGet = getMsgTot - getMsgTotLast;
 
  let timePassed = (now - start) / 1000;
  console.log(`clients: ${clientCount}, time: ${timePassed.toFixed(2)}s,
    send: ${sendMsg}, get: ${receivedMsg} on: ${msgGetPercentage}%
    send: ${sendMsgTot} get: ${getMsgTot} on: tot: ${totPercentage}%
    tickSend-Miss: ${tickSend-sendMsg}, tickGet-Miss: ${tickGet-receivedMsg}`);
  
  // console.log(`onGiong: `, clientCount/MAX_CLIENTS)
  CLIENT_CREATION_INTERVAL_IN_MS = clientCount/MAX_CLIENTS < 0.5 ? 5 : clientCount/MAX_CLIENTS < 0.7 ? 10 : clientCount/MAX_CLIENTS < 0.9 ? 20 : 50
  sendMsgTotLast = sendMsgTot;
  getMsgTotLast = getMsgTot;
  packetsSinceLastReport = 0;
  sendMsg = 0;
  receivedMsg = 0;
  lastReport = now;
};

setInterval(printReport, 1500);