const Axios = require("axios");
const fetch = require("node-fetch");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const xlsxFile = require("read-excel-file/node");
const expressApp = require("../servers").expressApp;
const io = require("../servers").io;
const MIG_DIR = "/Users/mmt8210/Desktop/post_book_mig";
const { getFileNameSuffix } = require("../dateTimeSuffix");
let CsvRowValue = require("./classes/CsvRowValue");
let BookDataRequest = require("./classes/BookDataRequest");
let ResponseStatus = require("./classes/ResponseStatus");

const RAVI_URL = `http://10.66.39.115:8004/flights-booking/v1/bookJson`;
const MONGO_BASE_URL = "http://localhost:8080/flights-pnr-service/v2";

const CHECK_MONGO_DATA_URL = `${MONGO_BASE_URL}/getAllByIdSource`;

const UPLOAD_MOGO_DATA_URL = `${MONGO_BASE_URL}/bookdata-internal`;

let creditShellData = [];

let postOption = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

expressApp.post("/upload_mig_file", (req, res, next) => {
  if (!req.files || !Object.keys(req.files)) {
    res.status(500).send({ status: "failire", message: "file not found " });
  } else {
    let uploadedFile = req.files.file;
    const filename = `${getFileNameSuffix()}_${uploadedFile.name}`;
    uploadedFile.mv(`${MIG_DIR}/${filename}`, (error) => {
      if (error) {
        res
          .status(500)
          .send({ status: "Failure", msg: "Could not upload file", filename });
      } else {
        console.log("file uploaded " + filename);
        res
          .status(200)
          .send({ status: "SUCCESS", msg: "File uploaded", filename });
      }
    });
  }
});

expressApp.post("/trigger_mig", (req, res, next) => {
  const filename = req.body.filename;
  const fullfilepath = `${MIG_DIR}/${filename}`;

  migrate(fullfilepath);
  setTimeout(() => {
    res.send({ status: "Hello data " });
  }, 10000);
});

async function migrate(filepath) {
  let outPutFilePath =
    filepath.substring(0, filepath.lastIndexOf(".")) + "_output.csv";
  const csvData = [];
  sendMessage("---- starting migration ----");
  const rows = await xlsxFile(filepath);
  for (let i = 0; i < rows.length; i++) {
    if (i !== 0) {
      const csvRowValue = new CsvRowValue();
      console.log(rows[i]);
      let booking_id = rows[i][0].trim();

      csvRowValue.booking_id = booking_id;

      try {
        console.log("processing for booking id " + booking_id);
        sendMessage("processing for booking id " + booking_id);

        const fetchDataResponse = await fetchData(booking_id);
        if (fetchDataResponse.isPresent) {
          let bookDataRequest = getBookDataRequest(
            fetchDataResponse.data,
            booking_id
          );
          const source = bookDataRequest.source;
          csvRowValue.source = source;
          const mongoDataResponse = await checkDataNotPresent(
            booking_id,
            source
          );
          if (mongoDataResponse.isAbsent) {
            const migrateDataResponse = await migrateData(
              booking_id,
              source,
              fetchDataResponse
            );
            csvRowValue.status = migrateDataResponse.status;
            csvRowValue.remark = migrateDataResponse.remark;
            console.log("migration done for booking id " + booking_id);
            sendMessage("migration done for booking id " + booking_id);
          } else if (mongoDataResponse.isBadRequest) {
            csvRowValue.status = "BAD REQUEST";
            csvRowValue.remark = mongoDataResponse.remark;
            console.log(
              `migration failure bad request ${mongoDataResponse.remark}`
            );
            sendMessage(
              `migration failure bad request ${mongoDataResponse.remark}`
            );
          } else {
            csvRowValue.status = "ALREADY PRESENT";
            csvRowValue.remark = mongoDataResponse.remark;
            console.log(`migration failure ${mongoDataResponse.remark}`);
            sendMessage(`migration failure ${mongoDataResponse.remark}`);
          }
        } else {
          csvRowValue.status = "FAILURE";
          csvRowValue.remark = fetchDataResponse.remark;
          console.log(`migration failure  ${fetchDataResponse.remark}`);
          sendMessage(`migration failure  ${fetchDataResponse.remark}`);
        }
      } catch (error) {
        console.log("processing failure for booking id " + booking_id);
        console.log(error);
        csvRowValue.status = "FAILURE";
        csvRowValue.remark = JSON.stringify(error);
        sendMessage("processig failure for booking id " + booking_id);
      }
      csvData.push(csvRowValue);
    }
  }

  sendMessage(`processed total  ${rows.length - 1} booking_ids`);
  sendMessage("writing result to csv file");
  sendMessage("credit shell row count " + creditShellData.length);
  await writeToCSvFile([...csvData, ...creditShellData], outPutFilePath);
  sendMessage("successfully written result to csv file");
  // clear credit shell
  creditShellData = [];
  sendMessage("---- migration done ----");
}

async function migrateData(booking_id, source, fetchDataResponse) {
  let migrateDataResponse = new ResponseStatus();
  if (fetchDataResponse.isPresent) {
    // TODO ADD CREDIT SHELL
    const bookDataRequest = getBookDataRequest(
      fetchDataResponse.data,
      booking_id
    );
    try {
      let uploadResponse = await fetch(
        `${UPLOAD_MOGO_DATA_URL}?booking_id=${booking_id}`,
        {
          ...postOption,
          body: JSON.stringify(bookDataRequest),
        }
      );

      const statusCode = uploadResponse.status;
      if (statusCode === 200) {
        migrateDataResponse.status = "SUCCESS";
        migrateDataResponse.remark = `Successfully uploaded data to mongo ${booking_id}`;
      } else {
        migrateDataResponse.status = "FAILURE";
        migrateDataResponse.remark = `Could not migrate  data ${fetchDataResponse.data} statusCode :  ${statusCode}`;
      }
    } catch (error) {
      migrateDataResponse.status = "FAILURE";
      migrateDataResponse.remark = `Error while  data  migration${fetchDataResponse.data}  ${error}`;
      console.log("------");
      console.log(error);
    }
  } else {
    migrateDataResponse.status = "FAILURE";
    migrateDataResponse.remark = `Could not get data from MYSQL ${booking_id} ${fetchDataResponse.remark} `;
  }
  return migrateDataResponse;
}

/**
 * this fetch data from ravi api for minimal book json, this function response will be put in mongo db
 */
async function fetchData(booking_id) {
  let responseStatus = new ResponseStatus();
  let URL = `${RAVI_URL}?mmtId=${booking_id}`;

  try {
    const response = await Axios.get(URL);
    const status = response.status;
    const data = response.data;
    if (status === 200) {
      responseStatus.isPresent = true;
      responseStatus.status = "SUCCESS";
      responseStatus.data = data;
      addCreditShellBookingId(data);
    } else {
      responseStatus.isPresent = false;
      responseStatus.status = "FAILURE";
      responseStatus.remark = JSON.stringify(data);
    }
  } catch (error) {
    responseStatus.isPresent = false;
    responseStatus.status = "FAILURE";
    responseStatus.remark = JSON.stringify(error);
  }
  return responseStatus;
}

/**
 * this function checks if data is present in mongo db
 */
async function checkDataNotPresent(booking_id, source) {
  const response = await fetch(
    `${CHECK_MONGO_DATA_URL}?booking_id=${booking_id}&source=${source}`
  );
  const data = await response.json();
  let isAbsent = false;
  let remark = "";
  let isBadRequest = false;

  if (response.status === 404) {
    isAbsent = true;
    remark = `Data not preset in mongo for bookingid ${booking_id} ${JSON.stringify(
      data
    )}`;
  } else if (response.status === 200) {
    remark = "Data preset in mongo for bookingid " + booking_id;
  } else {
    isBadRequest = true;
    remark = `Bad request ${response.status} ${JSON.stringify(data)}`;
  }
  return {
    isAbsent,
    remark,
    isBadRequest,
  };
}

async function writeToCSvFile(records, filePath) {
  try {
    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: "booking_id", title: "booking_id" },
        { id: "source", title: "source" },
        { id: "status", title: "status" },
        { id: "remark", title: "remark" },
      ],
    });
    csvWriter.writeRecords(records);
    console.log("successfully added to file");
  } catch (error) {
    console.error("error in writing to csv file");
    console.log(error);
  }
}

function getBookDataRequest(mysqlData, booking_id) {
  let bookDataRequest = new BookDataRequest();
  if (mysqlData.metaData === undefined) {
    throw "metdata not present can not create request ";
  } else if (mysqlData.metaData.lob === undefined) {
    throw "lob not present ";
  } else if (mysqlData.metaData.source === undefined) {
    throw "source not prsent ";
  }
  const metdata = mysqlData.metaData;
  bookDataRequest.lob = metdata.lob;
  bookDataRequest.source = metdata.source.toUpperCase();
  bookDataRequest.booking_id = booking_id;
  bookDataRequest.postbook = mysqlData;
  return bookDataRequest;
}

function addCreditShellBookingId(data) {
  if (
    data !== undefined &&
    data.bookingInfo !== undefined &&
    data.bookingInfo.frInfo !== undefined &&
    data.bookingInfo.frInfo.bookingFareInfo !== undefined &&
    data.bookingInfo.frInfo.bookingFareInfo.creditShellData !== undefined &&
    data.bookingInfo.frInfo.bookingFareInfo.creditShellData.bkId !== undefined
  ) {
    let csvRowValue = new CsvRowValue();
    csvRowValue.booking_id = data.bookingInfo.frInfo.bookingFareInfo.creditShellData.bkId.trim();
    csvRowValue.source = data.metaData.source.trim();
    csvRowValue.status = "CREDIT_SHELL";
    csvRowValue.remark = `migrate this booking_id, its parent booking_id ${data.metaData.bookingId}`;
    creditShellData.push(csvRowValue);
    // creditShellData.push({
    //   booking_id: data.bookingInfo.frInfo.bookingFareInfo.creditShellData.bkId.trim(),
    //   source: data.metaData.source.trim(),
    // });
  }
}

function sendMessage(message) {
  io.emit("fromServer", { data: message });
}

// io.on("connect", (socket) => {
//   console.log(socket.id);
//   let i = 1;
//   socket.emit("fromServer", { data: "hello from socket " + i++ });
//   // const intetval = setInterval(() => {
//   //   socket.emit("fromServer", { data: "hello from socket " + i++ });
//   // }, 2000);
//   // setTimeout(() => {}, [240000]);
// });
