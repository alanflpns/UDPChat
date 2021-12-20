import dgram from "dgram";

import * as readline from "readline";
import { stdin as input, stdout as output } from "process";
import dotenv from "dotenv";

import { Client } from "./types/types";
import { ConnectionSuccessful, ServerMessage } from "./types/server-types";
import { ClientMessage } from "./types/client-types";

dotenv.config();

const port = Number(process.env.PORT);
const address = process.env.ADDRESS;

const clients: Client[] = [];

const multicast = (
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
      return unicast(message, client, () => {
        server.close();
        console.log(`Server encerrado por ${sendingUser?.author}`);
      });
    }

    unicast(message, client);
  });
};

function unicast(
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
      // multicast(
      //   {
      //     type: "newConnection",
      //     client: newClient,
      //   },
      //   newClient
      // );

      const connectionInfo: ConnectionSuccessful = {
        type: "conectionSuccessful",
        client: newClient,
      };
      unicast(connectionInfo, newClient);

      break;
    case "message":
      multicast(
        {
          type: "message",
          message: unbufferedMessage.message,
          client: client!,
        },
        client
      );
      break;
    case "disconnect":
      multicast(
        {
          type: "disconnect",
          client: client!,
        },
        client,
        { closeServerAfterSend: true }
      );
      break;
    case "list-users":
      unicast({ type: "list-users", clients }, client!);
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

server.on("close", () => {
  rl.close();
  console.log('Pressione "Ctrl + C" para encerrar.');
});

server.on("error", (error) => {
  console.log("Server Error");
  console.log(error.message);
  server.close();
});

const rl = readline.createInterface({ input, output, terminal: false });

rl.on("line", (input) => {
  switch (input) {
    default:
      console.log("Comando não encontrado");
      break;
  }
});
