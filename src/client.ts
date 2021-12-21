import dgram from "dgram";
import * as readline from "readline";
import { stdin as input, stdout as output } from "process";
import dotenv from "dotenv";

import {
  ClientMessage,
  Connect,
  MessageClient,
  DisconnectFromServer,
  DisconnectFromChat,
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
// const ac1 = new AbortController();
// let signal1 = ac1.signal;
// const ac2 = new AbortController();
// let signal2 = ac2.signal;

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
  rl.question(
    "\n----- OPÇÕES ----- \n[1] Ver lista de usuários \n[2] Aguardar contato \n[3] Encerrar \nInforme uma opção: ",
    // { signal: signal1 },
    (answer) => {
      if (answer === "1") {
        return sendMessage({ type: "list-users" });
      }

      if (answer === "2") {
        console.log("Aguardando contato...");
        return sendMessage({ type: "wait-contact" });
      }

      if (answer === "3") {
        const messageDisconnect: DisconnectFromServer = {
          type: "disconnect",
        };

        return sendMessage(messageDisconnect, {
          closeServerAfterSendMessage: true,
        });
      }

      console.log("Essa opção não existe...");
      questionStart();
    }
  );
}

async function questionConnectUser(users: Client[]) {
  if (users.length > 0) {
    console.log("\n===== LISTA DE USUÁRIOS DISPONIVEIS =====\n");
    users.map((user, index) => console.log(`[${index + 1}] ${user.author}`));
    rl.question(
      `[${users.length + 1}] Aguardar contato \n[${
        users.length + 2
      }] Voltar \nInforme uma opção: `,
      // { signal: signal2 },
      (answer) => {
        if (
          isNaN(Number(answer)) ||
          Number(answer) < 1 ||
          Number(answer) > users.length + 2
        ) {
          console.log("Essa opção não existe...");
          questionConnectUser(users);
        } else if (Number(answer) === users.length + 1) {
          console.log("Aguardando contato...");
          sendMessage({ type: "wait-contact" });
        } else if (Number(answer) === users.length + 2) {
          questionStart();
        } else {
          sendMessage({
            type: "start-chat",
            clientToConnect: users[Number(answer) - 1],
          });
        }
      }
    );
  } else {
    console.log("\nNenhum usuario disponivel atualmente...");
    questionStart();
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
        // ac1.abort();
        // ac2.abort();

        output.clearLine(0);
        output.cursorTo(0);
        console.log(
          `\n Um novo chat foi iniciado com ${otherUser?.address} | ${otherUser?.author}`
        );
        console.log('\n(Digite "exit" para sair do chat)');
        rl.setPrompt("");
        if (!rl.getPrompt().length) {
          rl.setPrompt(
            `${
              unbufferedMessage.chat.clients.find(
                (user) => user.author === userName
              )?.address
            } | ${userName}: `
          );
        }

        startChat();
        break;
      case "server-error":
        output.clearLine(0);
        output.cursorTo(0);
        console.log(unbufferedMessage.message);
        break;
      case "disconnect-chat":
        console.log("O chat foi encerrado...");
        output.clearLine(0);
        output.cursorTo(0);
        // const newAc1 = new AbortController();
        // const newAc2 = new AbortController();
        // signal1 = newAc1.signal;
        // signal2 = newAc2.signal;
        questionStart();
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
        const messageDisconnect: DisconnectFromChat = {
          type: "disconnect-chat",
        };
        sendMessage(messageDisconnect);
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
