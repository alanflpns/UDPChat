import dgram from "dgram";
import * as readline from "readline";
import { stdin as input, stdout as output } from "process";

import {
  ServerMessage,
  ClientMessage,
  Connect,
  MessageClient,
  DisconnectFromServer,
} from "./interfaces";

const server = {
  host: "25.8.147.114",
  port: 5000,
};

const closeServer = "exit";
const rl = readline.createInterface({ input, output, terminal: false });
const client = dgram.createSocket("udp4");

let userName: string;
rl.question("Informe seu nome: ", (answer) => {
  userName = answer;
  connectServer();
});

function sendMessage(
  message: ClientMessage,
  options?: { closeServerAfterSendMessage: boolean }
) {
  const buffer = Buffer.from(JSON.stringify(message));

  client.send(buffer, 0, buffer.length, server.port, server.host, () => {
    if (options?.closeServerAfterSendMessage) {
      client.close();
      writeMsgTerminal("Conexão encerrada com sucesso!");
    }
  });
}

function writeMsgTerminal(message: string) {
  output.clearLine(0);
  output.cursorTo(0);
  console.log(message);
}

function connectServer() {
  client.bind();

  client.on("listening", () => {
    const connect: Connect = {
      type: "connect",
      author: userName,
    };

    sendMessage(connect);
  });

  client.on("message", (message) => {
    const unbufferedMessage = JSON.parse(String(message)) as ServerMessage;

    switch (unbufferedMessage.type) {
      case "conectionSuccessful":
        console.log(
          `Você foi conectado com o IP: ${unbufferedMessage.client.address}`
        );
        console.log(`(Digite "exit" para encerrar) \n`);
        rl.setPrompt(`${unbufferedMessage.client.address} | ${userName}: `);
        startChat();
        break;
      case "newConnection":
        writeMsgTerminal(
          `O usuario ${unbufferedMessage.client.author} se conectou \n`
        );
        rl.prompt();
        break;
      case "message":
        writeMsgTerminal(
          `${unbufferedMessage.client.address} | ${unbufferedMessage.client.author}: ${unbufferedMessage.message}`
        );
        rl.prompt();
        break;
      case "disconnect":
        client.close();
        writeMsgTerminal(
          `A conexão foi encerrada por ${unbufferedMessage.client.author}!`
        );
        break;
      default:
        console.log(unbufferedMessage);
        break;
    }
  });

  client.on("error", (err) => {
    console.log(err);
  });

  client.on("close", function () {
    rl.close();
    console.log('Pressione "Ctrl + C" para encerrar.');
  });
}

function startChat() {
  rl.prompt();

  rl.on("line", (input) => {
    rl.prompt();
    if (input.trim().length == 0) {
      return rl.write("Mensagem Inválida");
    }

    switch (input) {
      case closeServer:
        const messageDisconnect: DisconnectFromServer = {
          type: "disconnect",
        };
        sendMessage(messageDisconnect, { closeServerAfterSendMessage: true });
        break;
      default:
        const message: MessageClient = {
          message: input,
          type: "message",
        };
        sendMessage(message);
        break;
    }
  });
}
