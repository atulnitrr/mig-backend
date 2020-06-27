const fetch = require("node-fetch");
const e = require("express");
const { response } = require("express");

const PROD_PATH =
  "http://flights-pnr-service.ecs.mmt/flights-pnr-service/v1/mongoCreditShellAmount";

const DEV_PATH =
  "http://172.16.44.99:9093/flights-pnr-service/v1/mongoCreditShellAmount";

async function getData(pnr, airlinecode) {
  try {
    const response = await fetch(
      `${DEV_PATH}?airline=${airlinecode}&pnr=${pnr}`
    );
    try {
      const data = await response.json();
      return data;
    } catch (error) {
      if (response.status === 200) {
        return "no data found in mongo db";
      }
    }
  } catch (error) {
    console.log(error);
    return JSON.stringify(error);
  }
}

module.exports = { getData };
