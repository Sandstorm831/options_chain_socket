import express from "express";
import { createServer } from "http";
import { DefaultEventsMap, Server, Socket } from "socket.io";

const initialStrikeN = 18000;
const initialStrikeS = 68000;

const usersToSubscribers: Map<
  Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  string
> = new Map();

let seed: number[][] = [];
let underlyingN: number = 22498;
let underlyingS: number = 22498;
let underlying_seed_N = 22500;
let underlying_seed_S = 72500;
let connections = 0;
let timeInterval: NodeJS.Timeout | null = null;
let iniChecker: boolean = false;
const yesterPriceN = 23432;
const yesterPriceS = 23512;
const dbObject: number[][] = [];
seedPopulator();
let preCalcData: number[][] = dataBuilder();
type yesterPriceHolder = {
  N: number[][];
  S: number[][];
};

const yesterOptionPrice: yesterPriceHolder = {
  N: [],
  S: [],
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

function randomYesterdayPrices() {
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 75; i++) {
      const Cyp = randomInAB(20000, 25000);
      const Pyp = randomInAB(20000, 25000);
      const x = [Cyp, Pyp];
      if (j == 0) {
        yesterOptionPrice.N.push(x);
      } else {
        yesterOptionPrice.S.push(x);
      }
    }
  }
}

function randomInAB(miner: number, maxer: number) {
  return Math.random() * (maxer - miner) + miner;
}

function seedPopulator() {
  // console.log(`running seedPopulator, underlying : ${underlying}`);
  seed = [];
  for (let i = 0; i < 75; i++) {
    const x = [];
    let callP: number, putP: number;
    if (underlyingN > initialStrikeN + i * 100) {
      callP = underlyingN - initialStrikeN - i * 100;
      putP = Number(randomInAB(0, 5).toFixed(2));
    } else {
      callP = Number(randomInAB(0, 5).toFixed(2));
      putP = initialStrikeN + i * 100 - underlyingN;
    }
    x.push(callP);
    x.push(putP);
    seed.push(x);
  }
  for (let i = 0; i < 75; i++) {
    const x = [];
    let callP: number, putP: number;
    if (underlyingS > initialStrikeS + i * 100) {
      callP = underlyingS - initialStrikeS - i * 100;
      putP = Number(randomInAB(0, 5).toFixed(2));
    } else {
      callP = Number(randomInAB(0, 5).toFixed(2));
      putP = initialStrikeS + i * 100 - underlyingS;
    }
    x.push(callP);
    x.push(putP);
    seed.push(x);
  }
  // console.log("seed population done");
  // console.log(seed);
}

function initializerBuilder(ini: number, fin: number, a: number[][]) {
  for (let i = ini; i < fin; i++) {
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
    const putCP = Number((((putP - seed[i][1]) / seed[i][1]) * 100).toFixed(2));
    x.push(callCP);
    x.push(callP);
    if (i < 75) x.push(initialStrikeN + i * 100);
    else x.push(initialStrikeS + (i - 75) * 100);
    x.push(putP);
    x.push(putCP);
    if (i < 75) dbObject.push([initialStrikeN + i * 100, callP, putP]);
    else dbObject.push([initialStrikeS + (i - 75) * 100, callP, putP]);
    a.push(x);
  }
}

function seedChangerFunc() {
  const seedChangerN = Math.random();
  const seedChangerS = Math.random();
  let callSeedPopulator = false;
  if (seedChangerN < 0.01) {
    // console.log("changing the seed");
    underlyingN =
      underlying_seed_N +
      (Number(randomInAB(-1, 1).toFixed(2)) * underlying_seed_N) / 100;
    callSeedPopulator = true;
  }
  if (seedChangerS < 0.01) {
    // console.log("changing the seed");
    underlyingS =
      underlying_seed_S +
      (Number(randomInAB(-1, 1).toFixed(2)) * underlying_seed_S) / 100;
    callSeedPopulator = true;
  }
  if (callSeedPopulator) seedPopulator();
}

function dataBuilder() {
  let a: number[][] = [];
  if (!iniChecker) {
    initializerBuilder(0, 75, a);
    initializerBuilder(75, 150, a);
    iniChecker = true;
    return a;
  } else {
    // const inis = 75;
    // let cp: number = 0,
    //   pp: number = 0;
    for (let i = 0; i < 150; i++) {
      const x = [];
      const probC = Number(Math.random().toFixed(2));
      const probP = Number(Math.random().toFixed(2));
      if (probC < 0.1) {
        // cp += 1;
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
        dbObject[i][1] = callP;
        if (i < 75) x.push(initialStrikeN + i * 100);
        else x.push(initialStrikeS + (i - 75) * 100);
      } else {
        x.push(preCalcData[i][0]);
        x.push(preCalcData[i][1]);
        // Nothing to be done if value is unchanged
        if (i < 75) x.push(initialStrikeN + i * 100);
        else x.push(initialStrikeS + (i - 75) * 100);
      }
      if (probP < 0.1) {
        // pp += 1;
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
        dbObject[i][2] = putP;
      } else {
        x.push(preCalcData[i][3]);
        x.push(preCalcData[i][4]);
        // Nothing to be done if value is unchanged
      }
      a.push(x);
    }
    // console.log(`call probablity : ${cp}/${inis}`);
    // console.log(`Put probablity : ${pp}/${inis}`);
    seedChangerFunc();
    iniChecker = true;
    return a;
  }
}

io.on("connection", (socket) => {
  connections += 1;
  console.log(`Connected devices : ${connections}`);
  if (connections > 0 && timeInterval === null) {
    console.log("starting data transmission");
    io.emit("data", {
      data: preCalcData,
      underlyingN: underlyingN,
      underlyingS: underlyingS,
    });
    preCalcData = dataBuilder();
    timeInterval = setInterval(() => {
      io.emit("data", {
        data: dataBuilder(),
        underlyingN: underlyingN,
        underlyingS: underlyingS,
      });
      preCalcData = dataBuilder();
    }, 200);
  }
  socket.on("disconnect", () => {
    connections -= 1;
    console.log(`Connected devices : ${connections}`);
    if (connections <= 0) {
      if (timeInterval) {
        clearInterval(timeInterval);
        timeInterval = null;
      }
      console.log("Stopping transmission");
    }
  });

  socket.on("initialise", () => {
    const data = [];
    for (let i = 0; i < dbObject.length; i++) {
      data.push(dbObject[i][0]);
    }
    socket.emit("initialisedata", {
      yesterPrice: [yesterPriceN, yesterPriceS],
      yesterOptionPrices: yesterOptionPrice,
      data: data,
    });
  });

  socket.on("tokens", (data) => {
    usersToSubscribers.set(socket, data);
  });

  socket.on("option_chain", () => {});
});

httpServer.listen(8080, () => {
  console.log("Server is listening at http://localhost:8080");
});
