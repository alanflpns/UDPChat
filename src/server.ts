import dgram from "dgram";

import * as readline from "readline";
import { stdin as input, stdout as output } from "process";
import {
  AnyMessageClient,
  AnyMessageServer,
  ConnectionSuccessful,
} from "./interfaces";
// import { networkInterfaces } from "os";

// const nets = networkInterfaces();
// const results: any = {};

// for (const name of Object.keys(nets)) {
//   for (const net of nets[name]!) {
//     console.log(net);
//     // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
//     if (net.family === "IPv4" && !net.internal) {
//       if (!results[name]) {
//         results[name] = [];
//       }
//       results[name].push(net.address);
//     }
//   }
// }

const closeShortcut = "server close";

const port = 5000;
const address = "25.8.147.114";

const clients: dgram.RemoteInfo[] = [];

const broadcast = (
  message: AnyMessageClient,
  sendingUser?: dgram.RemoteInfo
) => {
  const clientsToSend = sendingUser
    ? clients.filter(
        (client) =>
          client.address != sendingUser.address ||
          client.port != sendingUser.port
      )
    : clients;

  clientsToSend.map((client) => sendUniqueMessage(message, client));
};

function sendUniqueMessage(
  message: AnyMessageClient,
  client: dgram.RemoteInfo
) {
  const msgBuffered = Buffer.from(JSON.stringify(message));

  return server.send(
    msgBuffered,
    0,
    msgBuffered.length,
    client.port,
    client.address
  );
}

const server = dgram.createSocket("udp4");

server.bind({
  address,
  port,
});

server.on("message", (message, rinfo) => {
  const unbufferedMessage = JSON.parse(String(message)) as AnyMessageServer;

  switch (unbufferedMessage.type) {
    case "connect":
      clients.push(rinfo);
      broadcast(
        {
          type: "message",
          message: `Nova conexão: ${rinfo.address}:${rinfo.port}`,
        },
        rinfo
      );

      const connectionInfo: ConnectionSuccessful = {
        type: "conectionSuccessful",
        address: rinfo.address,
        port: rinfo.port,
      };
      sendUniqueMessage(connectionInfo, rinfo);

      break;
    case "message":
      broadcast(
        {
          type: "message",
          message: `Nova conexão: ${rinfo.address}:${rinfo.port} \n${unbufferedMessage.message}`,
        },
        rinfo
      );
      break;
    case "disconnect":
      clients.splice(
        clients.findIndex(
          (client) =>
            client.address == rinfo.address && client.port == rinfo.port
        ),
        1
      );

      broadcast(
        {
          type: "message",
          message: `Desconectado: ${rinfo.address}:${rinfo.port}`,
        },
        rinfo
      );
    default:
      console.log(unbufferedMessage);
      break;
  }
});

server.on("connect", (data: any, rinfo: any) => {
  console.log("connect");
});

server.on("listening", () => {
  const serverAddress = server.address();

  console.log(
    `O servidor está ouvindo em ${serverAddress.address}:${serverAddress.port} `
  );
  // Para encerrar a conexão digite '${closeShortcut}'`
  // );
});

server.on("error", (error) => {
  console.log("error server");
  console.log(error.message);
  server.close();
});

// const sendMessage = (message: string) => {
//   const messageBuffered = Buffer.from(message);
//   console.log(`mensagem enviada com sucesso: "${messageBuffered}"`);
// };

const rl = readline.createInterface({ input, output, terminal: false });

rl.on("line", (input) => {
  switch (input) {
    case closeShortcut:
      // broadcast("Server encerrado");
      console.log(`Server Encerrado`);
      rl.close();
      break;
    default:
      console.log("Comando não encontrado");
      break;
  }
});

rl.on("close", () => {
  server.close();
});

// const server = dgram.createSocket("udp4", (data, rinfo) => {
//   const newData = JSON.parse(data.toString());
//   Message(newData.type, newData.message, rinfo);

//   process.stdin.resume();

//   process.stdin.removeAllListeners("data");
//   process.stdin.on("data", function (chunk) {
//     var buffer = Buffer.from(
//       "Server => %s" + chunk.toString().replace(/\n|\n/g, "")
//     );

//     clients.forEach((current: any) => {
//       server.send(buffer, 0, buffer.length, current.port, current.address);
//     });
//   });
// });
