import dgram from "dgram";

import * as readline from "readline";
import { stdin as input, stdout as output } from "process";
import dotenv from "dotenv";

import { Client } from "./types/types";
import {
  ConnectionSuccessful,
  OpenedChat,
  ServerMessage,
} from "./types/server-types";
import { ClientMessage } from "./types/client-types";

dotenv.config();

const port = Number(process.env.PORT);
const address = process.env.ADDRESS;

const clients: Client[] = [];
const openedChats: OpenedChat[] = [];

function generateId() {
  return `${Math.floor(Math.random() * Date.now())}`;
}

function toEqualClient(client: Client, clientToCompare: Client) {
  return (
    clientToCompare.address !== client?.address ||
    clientToCompare.port !== client?.port
  );
}

const multicast = (
  message: ServerMessage,
  sendingUser?: Client,
  options?: { closeServerAfterSend?: boolean }
) => {
  const clientsToSend = sendingUser
    ? clients.filter((client) => toEqualClient(client, sendingUser))
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

function broadcast(
  message: ServerMessage,
  clients: Client[],
  sendingUser?: Client,
  options?: { closeServerAfterSend?: boolean }
) {
  clients.map((client, index) => {
    if (options?.closeServerAfterSend && clients.length == index) {
      return unicast(message, client, () => {
        server.close();
        console.log(`Server encerrado por ${sendingUser?.author}`);
      });
    }

    unicast(message, client);
  });
}

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

      unicast(
        {
          type: "connection-successful",
          client: newClient,
        },
        newClient
      );

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
      const usersToSend = clients.filter((clientList) =>
        toEqualClient(clientList, client!)
      );

      const usersAvailable = usersToSend.filter((clientList) =>
        openedChats.some((openedChat) =>
          openedChat.clients.some((chatUser) =>
            toEqualClient(clientList, chatUser)
          )
        )
      );

      console.log(usersAvailable);
      unicast({ type: "list-users", clients: usersAvailable }, client!);
      break;
    case "start-chat":
      const userHaveChat = openedChats.some((chat) =>
        chat.clients.some(
          (chatUser) =>
            toEqualClient(chatUser, client!) ||
            toEqualClient(chatUser, unbufferedMessage.clientToConnect)
        )
      );

      if (userHaveChat) {
        return unicast(
          {
            type: "server-error",
            message: "Um dos clientes já está em um chat!",
          },
          client!
        );
      }

      const newChat: OpenedChat = {
        clients: [client!, unbufferedMessage.clientToConnect],
        id: generateId(),
        startedAt: new Date(),
      };

      openedChats.push(newChat);

      broadcast({ type: "start-chat", chat: newChat }, newChat.clients);

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
