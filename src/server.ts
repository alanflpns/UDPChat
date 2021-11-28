import dgram from "dgram";
import util from "util";

const port = 3000;
const clients: any = [];

function Message(type: any, message: any, rinfo: any) {
  const brodcast = (msg: any) => {
    var _buffer = Buffer.from(msg);

    clients.forEach((current: any) => {
      if (current.port != rinfo.port) {
        server.send(_buffer, 0, _buffer.length, current.port, current.address);
      }
    });
  };

  const typeConnect = () => {
    var _message = util.format("Nova conexão: ", rinfo.port);
    clients.push(rinfo);

    brodcast(_message);
    console.log(_message);
  };

  const typeDisconnect = function () {
    var _message = util.format("Desconectado: ", rinfo.port);
    clients.splice(clients.indexOf(rinfo), 1);

    brodcast(_message);
    console.log(_message);
  };

  const typeMessage = function () {
    var _message = util.format("%d => %s", rinfo.port, message);

    brodcast(_message);
    console.log(_message);
  };

  switch (type) {
    case "connect":
      typeConnect();
      break;

    case "disconnect":
      typeDisconnect();
      break;

    case "message":
      typeMessage();
      break;

    default:
      break;
  }
}

const server = dgram.createSocket("udp4", (data, rinfo) => {
  const newData = JSON.parse(data.toString());
  Message(newData.type, newData.message, rinfo);

  process.stdin.resume();

  process.stdin.removeAllListeners("data");
  process.stdin.on("data", function (chunk) {
    var buffer = Buffer.from(
      "Server => %s" + chunk.toString().replace(/\n|\n/g, "")
    );

    clients.forEach((current: any) => {
      server.send(buffer, 0, buffer.length, current.port, current.address);
    });
  });
});

server.bind(port, function () {
  console.log("Servidor sendo executado na porta:.", port);
});
