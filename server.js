const express = require("express");
const socketio = require("socket.io");
const fetch = require("node-fetch");
const cors = require("cors");
const fileUpload = require("express-fileupload");
// this is for post boddy parsing
const bodyParser = require("body-parser");

//

//

const expressApp = express();
expressApp.use(fileUpload());
expressApp.use(cors());
expressApp.use(bodyParser.json());
expressApp.use(express.static(__dirname + "/public"));

const expressServer = expressApp.listen("3031", () => {
  console.log("Listening on port  3031");
});
let io = require("./socketinit").initialize(expressServer);
const { getData } = require("./CheckCS");
const { dummy, deletCS } = require("./deletecs");
const e = require("express");

// const io = socketio(expressServer);
// const io = socketio(expressServer);

// io.on("connect", (socket) => {
//   socket.on("msgToServer", (msg) => {
//     io.emit("msgToClients", msg);
//   });
// });

// io.on("connect", (socket) => {
//   // console.log("data");
//   setInterval(() => {
//     // socket.emit("msgFromServer", { Data: "data" });
//   }, 1500);
// });

expressApp.get("/getcsdata/:pnr/:airlinecode", (req, res, data) => {
  console.log(req.params);
  getData(req.params.pnr, req.params.airlinecode)
    .then((data) => res.send(data))
    .catch((error) => res.status(500).send(error));
});

// delete fiel uplodad
expressApp.post("/upload_del_file", (req, res, next) => {
  if (!req.files || !Object.keys(req.files)) {
    res.status(400).send({ data: "no file given " });
  } else {
    const uploadedFile = req.files.file;
    const inputDir = __dirname + "/del_in_f";
    uploadedFile.mv(`${inputDir}/${uploadedFile.name}`, (error) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.status(200).send({ filename: uploadedFile.name });
      }
    });
  }
});

expressApp.post("/deletecs", (req, res, next) => {
  const filename = req.body.filename;
  console.log(filename);
  const outputFile = `${filename.substring(
    0,
    filename.lastIndexOf(".")
  )}_output.csv`;
  const inputFilePath = `${__dirname}/del_in_f/${filename}`;
  const outputFilePath = `${__dirname}/del_out_f/${outputFile}`;
  deletCS(inputFilePath, outputFilePath)
    .then((data) => {
      res.send({ status: "SUCCESS", filename: outputFile });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send({
        status: "FAILURE",
        filename: outputFile,
        error: error,
      });
    });
});

expressApp.post("/download_del_file", (req, res, next) => {
  const filename = req.body.filename;
  const filePath = `${__dirname}/del_out_f/${filename}`;
  res.sendFile(filePath, (error) => {
    if (error) {
      console.log("some error happened");
      res.status(500).send({ error: error });
    }
  });
});

expressApp.post;
