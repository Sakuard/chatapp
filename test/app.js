const { io } = require("socket.io-client");

const URL = process.env.URL || "http://localhost:4100";
const MAX_CLIENTS = 10000;
const CLIENT_CREATION_INTERVAL_IN_MS = 1;
const EMIT_INTERVAL_IN_MS = 2000;

let clientCount = 0;
let lastReport = new Date().getTime();
let packetsSinceLastReport = 0;

const createClient = () => {
  const socket = io(URL, {
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    const userId = `${Math.random().toString(36).substring(7)}`;
    setInterval(() => {
      socket.emit("test", "Test message from " + userId);
    }, EMIT_INTERVAL_IN_MS);
  });

  socket.on("test", (message) => {
    packetsSinceLastReport++;
  });

  socket.on("disconnect", (reason) => {
    console.log(`Client disconnected due to ${reason}`);
  });

  if (++clientCount < MAX_CLIENTS) {
    setTimeout(createClient, CLIENT_CREATION_INTERVAL_IN_MS);
  }
};

createClient();

const printReport = () => {
  const now = new Date().getTime();
  const durationSinceLastReport = (now - lastReport) / 1000;
  const packetsPerSecond = (
    packetsSinceLastReport / durationSinceLastReport
  ).toFixed(2);

  console.log(
    `Client count: ${clientCount}; Average packets received per second: ${packetsPerSecond}`
  );

  packetsSinceLastReport = 0;
  lastReport = now;
};

setInterval(printReport, 1500);
