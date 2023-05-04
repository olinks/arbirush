const express = require("express");
const bodyparser = require("body-parser");
const path = require("path");
const cors = require("cors");
const { startLottery } = require("./lottery");
const app = express();
const db = require("./db/db");
const morganMiddleware = require("./middlewares/morgan.middleware");

app.use(cors());
app.use(express.json());
app.use(morganMiddleware);
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/static"));

app.get("/", function (req, res) {
  res.jsonFile(path.join(__dirname, "/index.html"));
});

app.post("/start", function (req, res) {
  const pk = req.body.pk;
  // Here you can call the main function to start the bot
  startLottery(pk);
  res.json("Bot is running");
});

app.get("/transactions", async function (req, res) {
  try {
    const result = await db.getTransactions();
    res.json(result);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.get("/transactions/:address", async function (req, res) {
  const address = req.params.address;
  try {
    const result = await db.getTransactionsByAddress(address);
    res.json(result);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.get("/transactions/hash/:hash", async function (req, res) {
  const hash = req.params.hash;
  try {
    const result = await db.getTransactionByHash(hash);
    res.json(result);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = app;
