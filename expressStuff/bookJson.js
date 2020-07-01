const expressApp = require("../servers").expressApp;
const axios = require("axios");
const { default: Axios } = require("axios");
const PROD_GET_URL = `http://flights-pnr-service.ecs.mmt/flights-pnr-service/v2/bookdata`;

expressApp.get("/post_book_mig/:booking_id/:source", (req, res, next) => {
  const booking_id = req.params.booking_id;
  const source = req.params.source;
  migSingleData(booking_id, source)
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      res.status(500).send({ status: "FAILURE", error: error });
    });
});

async function migSingleData(booking_id, source) {
  try {
    const response = await Axios.get(
      `${PROD_GET_URL}?source=${source}&booking_id=${booking_id}`
    );
    return response.data;
  } catch (error) {
    return error;
  }
}
