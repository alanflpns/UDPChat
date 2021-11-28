import dgram from "dgram";
import * as readline from "readline";
import { stdin as input, stdout as output } from "process";

import {
  AnyMessageClient,
  AnyMessageServer,
  Connect,
  MessageServer,
} from "./interfaces";

const server = {
  host: "25.8.147.114",
  port: 5000,
};

const rl = readline.createInterface({ input, output, terminal: false });
const client = dgram.createSocket("udp4");

let userName: string;
rl.question("Informe seu nome: ", (answer) => {
  userName = answer;
  connectServer();
});

function sendMessage(message: AnyMessageServer) {
  const buffer = Buffer.from(JSON.stringify(message));

  client.send(buffer, 0, buffer.length, server.port, server.host);
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
    const unbufferedMessage = JSON.parse(String(message)) as AnyMessageClient;

    switch (unbufferedMessage.type) {
      case "conectionSuccessful":
        console.log(
          `Você foi conectado com o IP: ${unbufferedMessage.address}`
        );
        console.log(`(Digite "exit" para encerrar) \n`);
        rl.setPrompt(`${unbufferedMessage.address} | ${userName}: `);
        startChat();
        break;
      case "newConnection":
        output.clearLine(0);
        output.cursorTo(0);
        console.log(`O usuario ${unbufferedMessage.author} se conectou \n`);
        rl.prompt();
        break;
      case "message":
        output.clearLine(0);
        output.cursorTo(0);
        console.log(
          `Mensagem recebida de ${unbufferedMessage.address} | ${unbufferedMessage.author}: ${unbufferedMessage.message}`
        );
        rl.prompt();
        break;
      default:
        console.log(unbufferedMessage);
        break;
    }
  });

  // client.on("error", (err) => {
  //   console.log(err);
  // });

  // client.on("close", function () {
  //   const close:  = {
  //     type: "disconnect",
  //     author: userName,
  //   };
  //   const buffer = Buffer.from(JSON.stringify(close));

  //   console.log("Você foi desconectado", client.address().port);
  //   sendMessage(close);
  //   client.send(buffer, 0, buffer.length, server.port, server.host);
  // });
}

function startChat() {
  rl.prompt();

  rl.on("line", (input) => {
    rl.prompt();
    if (input.trim().length == 0) {
      return rl.write("Mensagem Inválida");
    }

    const message: MessageServer = {
      author: userName,
      message: input,
      type: "message",
    };

    sendMessage(message);
  });
}
// function Command() {
//   process.stdin.on("data", (chunk) => {
//     let object;
//     const message = chunk.toString().replace(/\n|\n/g, "");

//     if (message === "exit") {
//       object = '{"type":"disconnect"}';
//       console.log('Pressione "Ctrl + C" para encerrar.');
//     } else {
//       object = '{"type":"message","message":"' + message + '"}';
//     }

//     const buffer = Buffer.from(object);
//     client.send(buffer, 0, buffer.length, server.port, server.host);
//   });
// }

// const client = dgram.createSocket("udp4", (message) => {
//   console.log("%s", message.toString());
//   process.stdin.resume();

//   process.stdin.removeAllListeners("data");
//   process.stdin.on("data", () => {
//     Command();
//   });
// });

// client.on("listening", () => {
//   const buffer = Buffer.from('{"type":"connect"}');

//   console.log("Cliente conectou-se a porta:.", client.address().port);
//   console.log('(Digite "exit" para encerrar)');
//   client.send(buffer, 0, buffer.length, server.port, server.host);
// });

// client.on("error", (err) => {
//   console.log(err);
// });

// client.on("close", function () {
//   const buffer = Buffer.from('{"type":"disconnect"}');

//   console.log("Cliente desconectado.", client.address().port);
//   client.send(buffer, 0, buffer.length, server.port, server.host);
// });

// process.stdin.resume();
// Command();
