import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

function randomInAB(miner: number, maxer: number) {
  return Math.random() * (maxer - miner) + miner;
}

function dataBuilder() {
  let a = [];
  for (let i = 0; i < 75; i++) {
    const x = [];
    x.push(randomInAB(1, 10));
    x.push(randomInAB(20000, 25000));
    x.push(randomInAB(20000, 25000));
    x.push(randomInAB(20000, 25000));
    x.push(randomInAB(1, 10));
    a.push(x);
  }
  return a;
}

let connections = 0;
let timeInterval: NodeJS.Timeout | null = null;
let preCalcData = dataBuilder();

io.on("connection", (socket) => {
  connections += 1;
  if (connections > 0 && timeInterval === null) {
    console.log("starting data transmission");
    io.emit("data", preCalcData);
    preCalcData = dataBuilder();
    timeInterval = setInterval(() => {
      io.emit("data", dataBuilder());
      preCalcData = dataBuilder();
    }, 1000);
  }
  socket.on("disconnect", () => {
    connections -= 1;
    if (connections <= 0) {
      if (timeInterval) {
        clearInterval(timeInterval);
        timeInterval = null;
      }
      console.log("Stopping transmission");
    }
  });
});

httpServer.listen(8080, () => {
  console.log("Server is listening at http://localhost:8080");
});
