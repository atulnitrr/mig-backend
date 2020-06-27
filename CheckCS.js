const fetch = require("node-fetch");

const PROD_PATH =
  "http://flights-pnr-service.ecs.mmt/flights-pnr-service/v1/mongoCreditShellAmount";

const DEV_PATH =
  "http://172.16.44.99:9093/flights-pnr-service/v1/mongoCreditShellAmount";

async function getData(pnr, airlinecode) {
  const response = await fetch(`${DEV_PATH}?airline=${airlinecode}&pnr=${pnr}`);
  const data = await response.json();
  return data;
}

module.exports = { getData };
