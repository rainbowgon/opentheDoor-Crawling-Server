import masterKeyInfoCrawl from "./src/informationCrawlers/masterkey/run.js";
import masterKeyTimeCrawl from "./src/timeCrawlers/masterkey/run.js";
import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cron from "node-cron";

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
// app.use("/public", express.static(__dirname + "/public"));

const server = http.createServer(app);
const PORT = 3000;

cron
  .schedule("*/20 * * * * *", () => {
    masterKeyTimeCrawl(0);
  })
  .start();

app.get("/info/masterkey", async (req, res) => {
  const isSucceed = await masterKeyInfoCrawl();
  res.json({
    isSucceed,
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
