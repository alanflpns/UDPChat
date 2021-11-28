import dgram from "dgram";

const server = {
  host: "localhost",
  port: 3000,
};

function Command() {
  process.stdin.on("data", (chunk) => {
    let object;
    const message = chunk.toString().replace(/\n|\n/g, "");

    if (message === "exit") {
      object = '{"type":"disconnect"}';
      console.log('Pressione "Ctrl + C" para encerrar.');
    } else {
      object = '{"type":"message","message":"' + message + '"}';
    }

    const buffer = Buffer.from(object);
    client.send(buffer, 0, buffer.length, server.port, server.host);
  });
}

const client = dgram.createSocket("udp4", (message) => {
  console.log("%s", message.toString());
  process.stdin.resume();

  process.stdin.removeAllListeners("data");
  process.stdin.on("data", () => {
    Command();
  });
});

client.bind();

client.on("listening", () => {
  const buffer = Buffer.from('{"type":"connect"}');

  console.log("Cliente conectou-se a porta:.", client.address().port);
  console.log('(Digite "exit" para encerrar)');
  client.send(buffer, 0, buffer.length, server.port, server.host);
});

client.on("error", (err) => {
  console.log(err);
});

client.on("close", function () {
  const buffer = Buffer.from('{"type":"disconnect"}');

  console.log("Cliente desconectado.", client.address().port);
  client.send(buffer, 0, buffer.length, server.port, server.host);
});

process.stdin.resume();
Command();
