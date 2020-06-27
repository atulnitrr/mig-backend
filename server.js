const express = require("express");
const socketio = require("socket.io");
const fetch = require("node-fetch");
const cors = require("cors");

const expressApp = express();
expressApp.use(cors());

expressApp.use(express.static(__dirname + "/public"));

const expressServer = expressApp.listen("3031", () => {
  console.log("Listening on port  3031");
});
const io = socketio(expressServer);

io.on("connect", (socket) => {
  // socket.emit("fromServer", { data: "hello from server" });

  socket.on("msgToServer", (msg) => {
    io.emit("msgToClients", msg);
  });
});

expressApp.get("/getcsdata/:pnr/:airlinecode", (req, res, data) => {
  getData(req.params.pnr, req.params.airlinecode)
    .then((data) => res.send(data))
    .catch((error) => res.status(500).send(error));
});

async function getData(pnr, airlinecode) {
  const response = await fetch(
    `http://flights-pnr-service.ecs.mmt/flights-pnr-service/v1/mongoCreditShellAmount?airline=${airlinecode}&pnr=${pnr}`
  );
  const data = await response.json();
  return data;
}
