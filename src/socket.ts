import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const initialStrike = 18000;

let seed: number[][] = [];
let underlying: number = 22498;
let underlying_seed = 22500;
let connections = 0;
let timeInterval: NodeJS.Timeout | null = null;
let iniChecker: boolean = false;
seedPopulator();
let preCalcData: number[][] = dataBuilder();

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
  console.log(`running seedPopulator, underlying : ${underlying}`);
  seed = [];
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
  console.log("seed population done");
  console.log(seed);
}

function dataBuilder() {
  let a = [];
  if (!iniChecker) {
    console.log("here");
    for (let i = 0; i < 75; i++) {
      const x = [];
      const callP = Number(
        (
          seed[i][0] +
          (Number(randomInAB(-5, 5).toFixed(2)) * seed[i][0]) / 100
        ).toFixed(2),
      );
      const callCP = Number(
        (((callP - seed[i][0]) / seed[i][0]) * 100).toFixed(2),
      );
      const putP = Number(
        (
          seed[i][1] +
          (Number(randomInAB(-5, 5).toFixed(2)) * seed[i][1]) / 100
        ).toFixed(2),
      );
      const putCP = Number(
        (((putP - seed[i][1]) / seed[i][1]) * 100).toFixed(2),
      );
      x.push(callCP);
      x.push(callP);
      x.push(initialStrike + i * 100);
      x.push(putP);
      x.push(putCP);
      a.push(x);
    }
    iniChecker = true;
    return a;
  } else {
    const inis = 75;
    let cp: number = 0,
      pp: number = 0;
    for (let i = 0; i < 75; i++) {
      const x = [];
      const probC = Number(Math.random().toFixed(2));
      const probP = Number(Math.random().toFixed(2));
      if (probC < 0.2) {
        cp += 1;
        const callP = Number(
          (
            seed[i][0] +
            (Number(randomInAB(-5, 5).toFixed(2)) * seed[i][0]) / 100
          ).toFixed(2),
        );
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
      if (probP < 0.2) {
        pp += 1;
        const putP = Number(
          (
            seed[i][1] +
            (Number(randomInAB(-5, 5).toFixed(2)) * seed[i][1]) / 100
          ).toFixed(2),
        );
        const putCP = Number(
          (((putP - preCalcData[i][3]) / preCalcData[i][3]) * 100).toFixed(2),
        );
        x.push(putP);
        x.push(putCP);
      } else {
        x.push(preCalcData[i][3]);
        x.push(preCalcData[i][4]);
      }
      a.push(x);
    }
    console.log(`call probablity : ${cp}/${inis}`);
    console.log(`Put probablity : ${pp}/${inis}`);
    const seedChanger = Math.random();
    if (seedChanger < 0.01) {
      console.log("changing the seed");
      underlying =
        underlying_seed +
        (Number(randomInAB(-1, 1).toFixed(2)) * underlying_seed) / 100;
      seedPopulator();
    }
    iniChecker = true;
    return a;
  }
}

io.on("connection", (socket) => {
  connections += 1;
  if (connections > 0 && timeInterval === null) {
    console.log("starting data transmission");
    io.emit("data", { data: preCalcData, underlying: underlying });
    preCalcData = dataBuilder();
    timeInterval = setInterval(() => {
      io.emit("data", { data: dataBuilder(), underlying: underlying });
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
