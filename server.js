const express = require("express");
const socketio = require("socket.io");

const expressApp = express();

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
