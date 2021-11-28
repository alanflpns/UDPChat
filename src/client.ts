import dgram from "dgram";
import * as readline from "readline";
import { stdin as input, stdout as output } from "process";

import { Connect } from "./interfaces";

const server = {
  host: "25.8.147.114",
  port: 5000,
};

const rl = readline.createInterface({ input, output, terminal: false });

let userName: string;
rl.question("Informe seu nome: ", (answer) => {
  userName = answer;
  connectServer();
});

function connectServer() {
  let infoUser: any;
  const client = dgram.createSocket("udp4", (message, rinfo) => {
    infoUser = rinfo;
  });

  client.bind();

  client.on("listening", (teste: any) => {
    const connect: Connect = {
      type: "connect",
      author: userName,
    };

    const buffer = Buffer.from(JSON.stringify(connect));

    // console.log(client.address());
    // console.log(infoUser);

    // console.log( `` "Cliente conectou-se a porta:.", client.address().port);
    // console.log('(Digite "exit" para encerrar)');
    client.send(buffer, 0, buffer.length, server.port, server.host);
  });

  // client.on("error", (err) => {
  //   console.log(err);
  // });

  // client.on("close", function () {
  //   const buffer = Buffer.from('{"type":"disconnect"}');

  //   console.log("Cliente desconectado.", client.address().port);
  //   client.send(buffer, 0, buffer.length, server.port, server.host);
  // });
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
