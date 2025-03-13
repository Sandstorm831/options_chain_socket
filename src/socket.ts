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

function seedPopulator() {
  for (let i = 0; i < 75; i++) {
    const x = [];
    let callP: number, putP: number;
    if (underlying > initialStrike + i * 100) {
      callP = underlying - initialStrike - i * 100;
      putP = Number(randomInAB(0, 5).toFixed(2));
    } else {
      callP = Number(randomInAB(0, 5).toFixed(2));
      putP = initialStrike + i * 100 - underlying;
    }
    x.push(callP);
    x.push(putP);
    seed.push(x);
  }
}

function dataBuilder() {
  let a = [];
  if (preCalcData.length === 0) {
    for (let i = 0; i < 75; i++) {
      const x = [];
      const callP =
        seed[i][0] + Number(randomInAB(-5, 5).toFixed(2)) * seed[i][0];
      const callCP = Number(
        (((callP - seed[i][0]) / seed[i][0]) * 100).toFixed(2),
      );
      const putP =
        seed[i][1] + Number(randomInAB(-5, 5).toFixed(2)) * seed[i][1];
      const putCP = Number(
        (((seed[i][1] - putP) / seed[i][1]) * 100).toFixed(2),
      );
      x.push(callCP);
      x.push(callP);
      x.push(initialStrike + i * 100);
      x.push(putP);
      x.push(putCP);
      a.push(x);
    }
    return a;
  } else {
    for (let i = 0; i < 75; i++) {
      const x = [];
      const probC = Number(Math.random().toFixed());
      const probP = Number(Math.random().toFixed(2));
      if (probC < 0.3) {
        const callP =
          seed[i][0] + Number(randomInAB(-5, 5).toFixed(2)) * seed[i][0];
        const callCP = Number(
          (((callP - preCalcData[i][1]) / preCalcData[i][1]) * 100).toFixed(2),
        );
        x.push(callCP);
        x.push(callP);
        x.push(initialStrike + i * 100);
      } else {
        x.push(preCalcData[i][0]);
        x.push(preCalcData[i][1]);
        x.push(initialStrike + i * 100);
      }
      if (probP < 0.3) {
        const putP =
          seed[i][1] + Number(randomInAB(-5, 5).toFixed(2)) * seed[i][1];
        const putCP = Number(
          (((preCalcData[i][3] - putP) / preCalcData[i][3]) * 100).toFixed(2),
        );
        x.push(putP);
        x.push(putCP);
      } else {
        x.push(preCalcData[i][3]);
        x.push(preCalcData[i][4]);
      }
      a.push(x);
    }
    return a;
  }
  // for (let i = 0; i < 75; i++) {
  //   const x = [];
  //   x.push(Number(randomInAB(1, 10).toFixed(2)));
  //   x.push(Number(randomInAB(20000, 25000).toFixed(2)));
  //   x.push(Number((initialStrike + i * 100).toFixed(2)));
  //   x.push(Number(randomInAB(20000, 25000).toFixed(2)));
  //   x.push(Number(randomInAB(1, 10).toFixed(2)));
  //   a.push(x);
  // }
  // return a;
}

const initialStrike = 18000;
let seed: number[][] = [];
let underlying: number = 22498;
let connections = 0;
let timeInterval: NodeJS.Timeout | null = null;
let preCalcData: number[][] = dataBuilder();

seedPopulator();

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
