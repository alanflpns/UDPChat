import dgram from "dgram";

import * as readline from "readline";
import { stdin as input, stdout as output } from "process";
import dotenv from "dotenv";

import { Client } from "./types/types";
import { OpenedChat, ServerMessage } from "./types/server-types";
import {
  ClientMessage,
  DisconnectFromChat,
  MessageClient,
  WaitContact,
} from "./types/client-types";

dotenv.config();

const port = Number(process.env.PORT);
const address = process.env.ADDRESS;

let clients: Client[] = [];
let clientsWaitingContact: Client[] = [];
let openedChats: OpenedChat[] = [];

function generateId() {
  return `${Math.floor(Math.random() * Date.now())}`;
}

function toEqualClient(client: Client, clientToCompare: Client) {
  return (
    clientToCompare.address === client?.address &&
    clientToCompare.port === client?.port
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

function findChatByClient(client: Client, chats = openedChats) {
  const chat = chats.find((chat) =>
    chat.clients.some((chatClient) => toEqualClient(chatClient, client))
  );

  return chat;
}

function findChatById(id: string, chats: OpenedChat[]) {
  const chat = chats.find((chat) => chat.id === id);

  return chat;
}

function sendMessageInChat(client: Client, message: MessageClient) {
  const chat = findChatByClient(client!, openedChats);

  if (!chat) {
    return unicast(
      {
        type: "server-error",
        message: "Você não se encontra em nenhum chat no momento!",
      },
      client!
    );
  }

  const usersToSend = chat.clients.filter(
    (chatClient) => !toEqualClient(chatClient, client!)
  );

  broadcast(
    {
      type: "message",
      message: message.message,
      client: client!,
    },
    usersToSend
  );
}

function disconnectFromChat(client: Client, message: DisconnectFromChat) {
  const chat = findChatByClient(client);

  if (!chat) {
    return unicast(
      {
        type: "server-error",
        message: "Você não se encontra em nenhum chat no momento!",
      },
      client
    );
  }

  const newOpenedChats = Array.from(openedChats);

  newOpenedChats.splice(
    openedChats.findIndex((openedChat) => openedChat.id === chat.id),
    1
  );

  openedChats = newOpenedChats;

  broadcast({ type: "disconnect-chat" }, chat.clients);
}

function waitContact(client: Client, message: WaitContact) {
  const clientIsAwaiting = clientsWaitingContact.some((clientWaiting) =>
    toEqualClient(clientWaiting, client)
  );

  if (clientIsAwaiting) {
    return unicast(
      {
        type: "server-error",
        message: "Você já está aguardando contato!",
      },
      client
    );
  }

  clientsWaitingContact.push(client);
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

      unicast(
        {
          type: "connection-successful",
          client: newClient,
        },
        newClient
      );

      break;
    case "message":
      if (!client) return;
      sendMessageInChat(client, unbufferedMessage);
      break;
    case "disconnect":
      clients.splice(
        clients.findIndex((clientFromList) =>
          toEqualClient(clientFromList, client!)
        ),
        1
      );

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
      const usersAvailable = clientsWaitingContact.filter(
        (clientFromList) =>
          !(
            toEqualClient(clientFromList, client!) ||
            findChatByClient(clientFromList, openedChats)
          )
      );

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
      const newWaitingList = Array.from(clientsWaitingContact);

      newWaitingList.splice(
        newWaitingList.findIndex((clientFromList) =>
          toEqualClient(clientFromList, unbufferedMessage.clientToConnect)
        ),
        1
      );

      clientsWaitingContact = newWaitingList;

      broadcast({ type: "start-chat", chat: newChat }, newChat.clients);

      break;
    case "disconnect-chat":
      if (!client) return;
      disconnectFromChat(client, unbufferedMessage);
      break;
    case "wait-contact":
      if (!client) return;
      waitContact(client, unbufferedMessage);
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
