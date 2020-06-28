const xlsxFile = require("read-excel-file/node");
const fetch = require("node-fetch");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
let io = require("./socketinit").io();
const DelResponse = require("./DelResponse");

const PROD_PATH =
  "http://flights-pnr-service.ecs.mmt/flights-pnr-service/v1/deleteCreditShell";

const DEV_PATH =
  "http://172.16.44.99:9093/flights-pnr-service/v1/deleteCreditShell";

const AIR_INDIA_FAMILY = ["AK", "D7", "FD", "QZ", "XJ", "Z2", "I5"];
const AIR_I5 = "I5";

let deleteOption = {
  method: "DELETE",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

async function writeToCSvFile(records, filePath) {
  try {
    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: "pnr", title: "pnr" },
        { id: "airlinecode", title: "airlinecode" },
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

async function deletCS(fileName, outputFilePath) {
  const date = new Date();
  let resonMsg = "delete request on " + date.toLocaleString();
  const delResponses = [];
  const rows = await xlsxFile(fileName);
  console.log(rows);
  for (let i = 0; i < rows.length; i++) {
    let row = rows[i];
    if (i !== 0) {
      let pnr = row[0].trim();
      let requestAirline = row[1].trim().toUpperCase();
      let airline = AIR_INDIA_FAMILY.includes(requestAirline)
        ? AIR_I5
        : requestAirline;
      try {
        const response = await fetch(PROD_PATH, {
          ...deleteOption,
          body: JSON.stringify({
            airline: airline,
            csPnr: pnr,
            reason: resonMsg + "-" + requestAirline,
          }),
        });
        const result = await response.json();
        const rs = new DelResponse();
        rs.pnr = pnr;
        rs.airlinecode = airline;
        rs.status = result.status;
        rs.remark = JSON.stringify(result);
        console.log("deleted row --> " + JSON.stringify(rs));
        delResponses.push(rs);
      } catch (error) {
        console.error("error in delete for row " + row);
        console.log(error);
        throw error;
      }
    }
  }

  await writeToCSvFile(delResponses, outputFilePath);
  return delResponses;
}

module.exports = { deletCS };
