import dgram from "dgram";

import * as readline from "readline";
import { stdin as input, stdout as output } from "process";
import dotenv from "dotenv";

import {
  ClientMessage,
  ServerMessage,
  ConnectionSuccessful,
  Client,
} from "./interfaces";

dotenv.config();
// import { networkInterfaces } from "os";

// const nets = networkInterfaces();
// const results: any = {};

// for (const name of Object.keys(nets)) {
//   for (const net of nets[name]!) {
//     console.log(net)
//     // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
//     if (net.family === "IPv4" && !net.internal) {
//       if (!results[name]) {
//         results[name] = [];
//       }
//       results[name].push(net.address);
//     }
//   }
// }

// const closeShortcut = "server close";

const port = Number(process.env.PORT);
const address = process.env.ADDRESS;

const clients: Client[] = [];

const broadcast = (
  message: ServerMessage,
  sendingUser?: Client,
  options?: { closeServerAfterSend?: boolean }
) => {
  const clientsToSend = sendingUser
    ? clients.filter(
        (client) =>
          client.address != sendingUser.address ||
          client.port != sendingUser.port
      )
    : clients;

  clientsToSend.map((client, index) => {
    if (options?.closeServerAfterSend && clients.length == index) {
      return sendUniqueMessage(message, client, () => {
        server.close();
      });
    }

    sendUniqueMessage(message, client);
  });
};

function sendUniqueMessage(
  message: ServerMessage,
  client: Client,
  callback?: () => void
) {
  const msgBuffered = Buffer.from(JSON.stringify(message));

  return server.send(
    msgBuffered,
    0,
    msgBuffered.length,
    client.port,
    client.address,
    callback
  );
}

const server = dgram.createSocket("udp4");

server.bind({
  address,
  port,
});

server.on("message", (message, rinfo) => {
  const unbufferedMessage = JSON.parse(String(message)) as ClientMessage;
  console.log(unbufferedMessage);

  const client = clients.find(
    (client) => client.address == rinfo.address && client.port == rinfo.port
  );

  switch (unbufferedMessage.type) {
    case "connect":
      const newClient: Client = { author: unbufferedMessage.author, ...rinfo };
      clients.push(newClient);
      broadcast(
        {
          type: "newConnection",
          client: newClient,
        },
        newClient
      );

      const connectionInfo: ConnectionSuccessful = {
        type: "conectionSuccessful",
        client: newClient,
      };
      sendUniqueMessage(connectionInfo, newClient);

      break;
    case "message":
      broadcast(
        {
          type: "message",
          message: unbufferedMessage.message,
          client: client!,
        },
        client
      );
      break;
    case "disconnect":
      broadcast(
        {
          type: "disconnect",
          client: client!,
        },
        client
      );
      break;
    default:
      console.log(unbufferedMessage);
      break;
  }
});

server.on("connect", () => {
  console.log("connect");
});

server.on("listening", () => {
  const serverAddress = server.address();

  console.log(
    `O servidor está ouvindo em ${serverAddress.address}:${serverAddress.port} `
  );
});

server.on("error", (error) => {
  console.log("Server Error");
  console.log(error.message);
  server.close();
});

const rl = readline.createInterface({ input, output, terminal: false });

rl.on("line", (input) => {
  switch (input) {
    // case closeShortcut:
    //   rl.close();
    //   break;
    default:
      console.log("Comando não encontrado");
      break;
  }
});

// rl.on("close", () => {
//   console.log(`Server Encerrado`);
//   server.close();
// });
