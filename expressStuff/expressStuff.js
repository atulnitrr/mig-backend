const fetch = require("node-fetch");
const expressApp = require("../servers").expressApp;
const { getData } = require("../CheckCS");
const { deletCS } = require("../deletecs");
const { getFileNameSuffix } = require("../dateTimeSuffix");

expressApp.get("/getcsdata/:pnr/:airlinecode", (req, res, data) => {
  console.log(req.params);
  getData(req.params.pnr, req.params.airlinecode)
    .then((data) => res.send(data))
    .catch((error) => res.status(500).send(error));
});

// delete fiel uplodad
expressApp.post("/upload_del_file", (req, res, next) => {
  if (!req.files || !Object.keys(req.files)) {
    res.status(400).send({ data: "no file uploaded" });
  } else {
    let uploadedFile = req.files.file;
    let filename = uploadedFile.name;
    let extension = filename.split(".").pop();
    filename = `${filename.substring(
      0,
      filename.lastIndexOf(".")
    )}_${getFileNameSuffix()}.${extension}`;
    console.log();
    const inputDir = __dirname + "/del_in_f";
    uploadedFile.mv(`${inputDir}/${filename}`, (error) => {
      if (error) {
        console.log("error in delete file upload ");
        console.log(error);
        res.status(500).send({ error: error });
      } else {
        console.log("success file upload");
        res.status(200).send({ filename: filename });
      }
    });
  }
});

expressApp.post("/deletecs", (req, res, next) => {
  const filename = req.body.filename;
  const outputFile = `${filename.substring(
    0,
    filename.lastIndexOf(".")
  )}_output.csv`;
  const inputFilePath = `${__dirname}/del_in_f/${filename}`;
  const outputFilePath = `${__dirname}/del_out_f/${outputFile}`;
  deletCS(inputFilePath, outputFilePath)
    .then((data) => {
      console.log("successfull delete call");
      return res.send({ status: "SUCCESS", filename: outputFile });
    })
    .catch((error) => {
      console.log("error in delete call");
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
      console.log("some error while api file download");
      res.status(500).send({ error: error });
    } else {
      console.log("successfull download file " + filename);
    }
  });
});

module.exports = {
  expressApp,
};
