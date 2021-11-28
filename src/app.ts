import dgram from "dgram";
import * as readline from "readline";
import { stdin as input, stdout as output } from "process";
const port = 5000;
const address = "25.8.147.114";

const server = dgram.createSocket("udp4");

server.bind({
  address,
  port,
});

server.on("message", (msg, rinfo) => {
  console.log("message");
  console.log(msg);
  console.log(rinfo);
});
``;

server.on("listening", () => {
  const serverAddress = server.address();

  console.log(
    `O servidor está ouvindo em ${serverAddress.address}:${serverAddress.port}`
  );
});

server.on("error", (error) => {
  console.log(error.message);
  server.close();
});

const sendMessage = (message: string) => {
  const messageBuffered = Buffer.from(message);
  console.log(`mensagem enviada com sucesso: "${messageBuffered}"`);
  server.send(message, port, (err) => {
    console.log(err?.message);
  });
};

const rl = readline.createInterface({ input, output });

rl.on("close", () => {
  rl.close();
});

rl.on("line", (input) => {
  if (input.trim().length == 0) {
    return rl.write("Mensagem Inválida");
  }

  sendMessage(input);
});
