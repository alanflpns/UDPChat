import dgram from "dgram";
import * as readline from "readline";
import { stdin as input, stdout as output } from "process";
import dotenv from "dotenv";
import util from "util";

import {
  ClientMessage,
  Connect,
  MessageClient,
  DisconnectFromServer,
} from "./types/client-types";

import { ServerMessage } from "./types/server-types";
import { Client } from "./types/types";

dotenv.config();

const server = {
  host: process.env.ADDRESS,
  port: Number(process.env.PORT),
};

const closeServer = "exit";
const rl = readline.createInterface({ input, output, terminal: false });
const client = dgram.createSocket("udp4");

const question = util.promisify(rl.question).bind(rl);

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

async function questionStart() {
  try {
    const answer: any = await question(
      "\n----- OPÇÕES ----- \n[1] Ver lista de usuários \n[2] Encerrar \nInforme uma opção: "
    );

    if (answer === "1") {
      return sendMessage({ type: "list-users" });
    }

    if (answer === "2") {
      const messageDisconnect: DisconnectFromServer = {
        type: "disconnect",
      };

      return sendMessage(messageDisconnect, {
        closeServerAfterSendMessage: true,
      });
    }

    console.log("Essa opção não existe...");
    questionStart();
  } catch (err) {
    console.error("Question rejected", err);
  }
}

async function questionConnectUser(users: Client[]) {
  if (users.length > 0) {
    console.log("\n===== LISTA DE USUÁRIOS DISPONIVEIS =====");
    users.map((user, index) => console.log(`[${index + 1}] ${user.author}`));

    try {
      const answer: any = await question(
        `[${users.length + 1}] Aguardar contato \nInforme uma opção: `
      );

      if (
        isNaN(Number(answer)) ||
        Number(answer) < 1 ||
        Number(answer) > users.length + 1
      ) {
        console.log("Essa opção não existe...");
        questionConnectUser(users);
      } else if (Number(answer) === users.length + 1) {
        console.log("Aguardando contato...");
      } else {
        sendMessage({
          type: "start-chat",
          clientToConnect: users[Number(answer) - 1],
        });
      }
    } catch (err) {
      console.error("Question rejected", err);
    }
  } else {
    console.log("\nNenhum usuario disponivel atualmente...");
    console.log("Aguardando contato...");
  }
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
      case "connection-successful":
        console.log(
          `Você foi conectado com o IP: ${unbufferedMessage.client.address} \n`
        );

        questionStart();
        // while (option !== "1" || option !== "2") {
        //   rl.question(
        //     "----- OPÇÕES ----- \n[1] Iniciar uma conversa \n[2] Encerrar \n",
        //     (answer) => {
        //       option = answer;

        //       if (answer !== 1 || answer !== 2) {
        //       }
        //       rl.setPrompt(
        //         `${unbufferedMessage.client.address} | ${userName}: `
        //       );
        //       startChat();
        //     }
        //   );
        // }

        // console.log("----- OPÇÕES -----");
        // console.log("[1] Iniciar uma conversa");
        // console.log("[2] Encerrar");
        // rl.question('')

        break;
      case "new-connection":
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
      case "list-users":
        questionConnectUser(unbufferedMessage.clients);
        break;
      case "start-chat":
        const otherUser = unbufferedMessage.chat.clients.find(
          (user) => user.author !== userName
        );
        // rl.close();

        rl.resume();

        output.clearLine(0);
        output.cursorTo(0);
        console.log(
          `\n Um novo chat foi iniciado com ${otherUser?.address} | ${otherUser?.author}`
        );
        rl.setPrompt(
          `${
            unbufferedMessage.chat.clients.find(
              (user) => user.author === userName
            )?.address
          } | ${userName}: `
        );
        startChat();
        break;
      case "server-error":
        console.log(unbufferedMessage.message);
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
