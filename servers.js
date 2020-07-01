const express = require("express");
const socketio = require("socket.io");

const cors = require("cors");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");

const expressApp = express();
expressApp.use(fileUpload());
expressApp.use(cors());
expressApp.use(bodyParser.json());
expressApp.use(express.static(__dirname + "/public"));

const expressServer = expressApp.listen("3031", () => {
  console.log("Listening on port  3031");
});
const io = socketio(expressServer);

module.exports = {
  io,
  expressApp,
};
