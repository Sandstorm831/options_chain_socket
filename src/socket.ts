import express from "express";
import { createServer } from "http";
import { DefaultEventsMap, Server, Socket } from "socket.io";
import { Token } from "typescript";

const initialStrikeN = 18000;
const initialStrikeS = 68000;

const SocketToSubscribers: Map<
  Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  string[]
> = new Map();

let seed: number[][] = [];
let underlyingN: number = 22498;
let underlyingS: number = 22498;
let underlyingNC: boolean = true;
let underlyingSC: boolean = true;
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
randomYesterdayPrices();

type tokenVal = {
  token: string;
  val: number;
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

function getIndexfromToken(token: string) {
  let index, subIndex, truthInd;
  const num = Number(token.slice(0, token.length - 1));
  const sym = token[token.length - 1];
  subIndex = sym === "C" ? 1 : 2;
  truthInd = sym === "C" ? 3 : 4;
  if (num < 30000) {
    index = (num - initialStrikeN) / 100;
  } else {
    index = (num - initialStrikeS) / 100;
  }
  return [index, subIndex, truthInd];
}

function sortCompareFunc(a: string, b: string) {
  if (a.length !== b.length) return a.length - b.length;
  return a.localeCompare(b);
}

// have to add weak black-scholes
function randomYesterdayPrices() {
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 75; i++) {
      const Cyp = Number(randomInAB(0, 3000).toFixed(2));
      const Pyp = Number(randomInAB(0, 3000).toFixed(2));
      const x = [Cyp, Pyp];
      if (j == 0) {
        x.push(initialStrikeN + i * 100);
        yesterOptionPrice.N.push(x);
      } else {
        x.push(initialStrikeS + i * 100);
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
    if (i < 75) dbObject.push([initialStrikeN + i * 100, callP, putP, 1, 1]);
    else dbObject.push([initialStrikeS + (i - 75) * 100, callP, putP, 1, 1]);
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
    underlyingNC = true;
  } else {
    underlyingNC = false;
  }
  if (seedChangerS < 0.01) {
    // console.log("changing the seed");
    underlyingS =
      underlying_seed_S +
      (Number(randomInAB(-1, 1).toFixed(2)) * underlying_seed_S) / 100;
    callSeedPopulator = true;
    underlyingSC = true;
  } else {
    underlyingSC = false;
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
        dbObject[i][3] = 1;
        if (i < 75) x.push(initialStrikeN + i * 100);
        else x.push(initialStrikeS + (i - 75) * 100);
      } else {
        x.push(preCalcData[i][0]);
        x.push(preCalcData[i][1]);
        dbObject[i][3] = 0;
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
        dbObject[i][4] = 1;
      } else {
        x.push(preCalcData[i][3]);
        x.push(preCalcData[i][4]);
        dbObject[i][4] = 0;
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

function getLatestvalues(subscriptions: string[]): tokenVal[] {
  let Ndone = false;
  let Sdone = false;
  let finalSet: tokenVal[] = [];
  for (let i = 0; i < subscriptions.length; i++) {
    if (Ndone && Sdone) break;
    else if (subscriptions[i] === "N") {
      Ndone = true;
      if (underlyingNC) {
        finalSet.push({
          token: `N`,
          val: underlyingN,
        });
      }
      for (let j = 0; j < 75; j++) {
        if (dbObject[j][3] === 1) {
          finalSet.push({
            token: `${dbObject[j][0].toString()}C`,
            val: dbObject[j][1],
          });
        }
        if (dbObject[j][4] === 1) {
          finalSet.push({
            token: `${dbObject[j][0].toString()}P`,
            val: dbObject[j][2],
          });
        }
      }
    } else if (subscriptions[i] === "S") {
      Sdone = true;
      if (underlyingSC) {
        finalSet.push({
          token: `S`,
          val: underlyingS,
        });
      }
      for (let j = 75; j < 150; j++) {
        if (dbObject[j][3] === 1) {
          finalSet.push({
            token: `${dbObject[j][0].toString()}C`,
            val: dbObject[j][1],
          });
        }
        if (dbObject[j][4] === 1) {
          finalSet.push({
            token: `${dbObject[j][0].toString()}P`,
            val: dbObject[j][2],
          });
        }
      }
    } else {
      if (
        Ndone &&
        Number(subscriptions[i].slice(0, subscriptions[i].length - 1)) < 30000
      ) {
        continue;
      } else if (
        Sdone &&
        Number(subscriptions[i].slice(0, subscriptions[i].length - 1)) > 30000
      ) {
        continue;
      } else {
        const [ind, subind, truthInd] = getIndexfromToken(subscriptions[i]);
        if (dbObject[ind][truthInd] === 1) {
          finalSet.push({
            token: subscriptions[i],
            val: dbObject[ind][subind],
          });
        }
      }
    }
  }
  return finalSet;
}

app.get("/init", (req, res) => {
  console.log("recieved a http request");
  res.send({
    yesterPriceN,
    yesterPriceS,
    yesterOptionPrice,
  });
  console.log("sent a response for http request");
});

io.on("connection", (socket) => {
  connections += 1;
  SocketToSubscribers.set(socket, []);
  console.log(`Connected devices : ${connections}`);
  if (connections > 0 && timeInterval === null) {
    console.log("starting data transmission");
    // console.time("measuringInitialFetch");
    // SocketToSubscribers.forEach((val, socketOne) => {
    //   const lvals: tokenVal[] = getLatestvalues(val);
    //   if (lvals.length > 0) socketOne.emit("update", lvals);
    // });
    // console.timeEnd("measuringInitialFetch");
    // io.emit("data", {
    //   data: preCalcData,
    //   underlyingN: underlyingN,
    //   underlyingS: underlyingS,
    // });
    dataBuilder();
    timeInterval = setInterval(() => {
      console.time("measuringRoutineFetch");
      SocketToSubscribers.forEach((val, socketOne) => {
        const lvals: tokenVal[] = getLatestvalues(val);
        if (lvals.length > 0) socketOne.emit("update", lvals);
      });
      console.timeEnd("measuringRoutineFetch");
      dataBuilder();
    }, 200);
  }

  socket.on("optionchain", (data: string, id: string) => {
    console.log("recieved optionchain");
    if (data === "N") {
      socket.emit("optionchaindata", underlyingN, dbObject.slice(0, 75), id);
      const temp = SocketToSubscribers.get(socket);
      temp?.push(data);
      temp?.sort(sortCompareFunc);
      if (temp) SocketToSubscribers.set(socket, temp);
      else SocketToSubscribers.set(socket, [data]);
      // console.log(SocketToSubscribers.get(socket));
    } else if (data === "S") {
      socket.emit(
        "optionchaindata",
        underlyingS,
        dbObject.slice(75, dbObject.length),
        id,
      );
      const temp = SocketToSubscribers.get(socket);
      temp?.push(data);
      temp?.sort(sortCompareFunc);
      if (temp) SocketToSubscribers.set(socket, temp);
      else SocketToSubscribers.set(socket, [data]);
      // console.log(SocketToSubscribers.get(socket));
    }
  });

  socket.on("release", (data: string) => {
    const old = SocketToSubscribers.get(socket);
    const x: string[] = [];
    old?.forEach((elem) => {
      if (elem !== data) x.push(elem);
    });
    SocketToSubscribers.set(socket, x);
  });

  socket.on("realtime", (data: string) => {
    const token = Number(data.slice(0, data.length - 1));
    const PorC = data[data.length - 1];
    let secInd: number;
    let ind: number;
    if (token < 30000) {
      ind = (token - initialStrikeN) / 100;
    } else {
      ind = (token - initialStrikeS) / 100;
    }
    if (PorC === "P") secInd = 2;
    else secInd = 1;
    socket.emit("realtimedata", {
      token: data,
      tokenval: dbObject[ind][secInd],
    });
    const temp = SocketToSubscribers.get(socket);
    temp?.push(data);
    temp?.sort(sortCompareFunc);
    if (temp) SocketToSubscribers.set(socket, temp);
    else SocketToSubscribers.set(socket, [data]);
  });

  socket.on("disconnect", () => {
    connections -= 1;
    SocketToSubscribers.delete(socket);
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

  socket.on("tokens", (data: string) => {
    // SocketToSubscribers.set(socket, data);
  });

  socket.on("option_chain", () => {});
});

httpServer.listen(8080, () => {
  console.log("Server is listening at http://localhost:8080");
});
