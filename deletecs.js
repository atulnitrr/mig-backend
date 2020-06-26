const xlsxFile = require("read-excel-file/node");
const fetch = require("node-fetch");
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

async function deletCS(fileName) {
  const date = new Date();
  let resonMsg = "delete request on " + date.toLocaleDateString();
  const delResponse = [];
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
        const response = await fetch(DEV_PATH, {
          ...deleteOption,
          body: JSON.stringify({
            airline: airline,
            csPnr: pnr,
            reason: resonMsg + requestAirline,
          }),
        });
        const result = await response.json();
        delResponse.push({ ...result, pnr, airline });
      } catch (error) {
        console.log(row, error);
      }
    }
  }
  return delResponse;
}

// ["FE1F2N", "SG"],

const data = [["S4DV7V", "G8"]];

module.exports = { deletCS };
