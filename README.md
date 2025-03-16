<div align="center">
<h3 align="center">Options-Socket</h3>

  <p align="center">
    Options-Socket is an open-source <a href="https://socket.io">Socket.IO</a> server for <a href="https://github.com/sandstorm831/option_chain">Option-Chain</a>.
    <br />
  </p>
</div>

<!-- TABLE OF CONTENTS -->

## Table of Contents

  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#prerequisites">Prerequisites</a></li>
    <li><a href="#built-with">Built with</a></li>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#license">License</a></li>
  </ol>

<!-- ABOUT THE PROJECT -->

## About The Project

Options-Socket is an open-source socket-io server primarily made for the [Option-Chain](https://github.com/sandstorm831/option_chain) project. It generates option-strike price data for 75 call and put options at an interval of 200ms along with the price of underlying. The prices generated are in *loosely* in accordance with [Black-Scholes model](https://en.wikipedia.org/wiki/Black%E2%80%93Scholes_model), with updates on prices and underlying occuring on a probablistic manner with varying probablity.
### Built With

[![Socket.IO][Socket.io]][Socket-url]
[![NodeJS][nodejs]][nodejs-url]
[![TypeScript][typescript]][typescript-url]

## Prerequisites

To run the project in your local machine, you must have

- Node.js : [Volta recommended](https://volta.sh/)

## Installation

Once you finish installation Node.js, follow the commands to setup the project locally on your machine

1. clone the project
   ```sh
   git clone https://github.com/Sandstorm831/options_chain_socket.git
   ```
2. enter the project
   ```sh
   cd options_chain_socket
   ```
3. Install NPM packages
   ```sh
   npm install
   ```

4. build the project

   ```sh
   npm run build
   ```

5. Start the server
   ```sh
    npm run start
   ```
   This completes the set-up for this project, all the functionalities present in the application will now be live at `port: 8080`, remember to bypass `CORS` setting present in the `server.ts` file to connect to any domain other than `localhost:3000`.

<!-- LICENSE -->


## License

Distributed under the GPL-3.0 license. See [LICENSE](./LICENSE) for more information.

[Socket.io]: https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101
[Socket-url]: https://socket.io/
[nodejs]: https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white
[nodejs-url]: https://nodejs.org/en
[typescript]: https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white
[typescript-url]: https://www.typescriptlang.org/
