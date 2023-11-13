import dotenv from "dotenv";

dotenv.config();

import run from "./modules/informationCrawlers/masterkey/run.js";
import express from "express";
import http from "http";
import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
// app.use("/public", express.static(__dirname + "/public"));

const server = http.createServer(app);
const PORT = 3000;

app.get("/info/masterkey", async (req, res) => {
  console.log("LISTENING...... /info/masterkey");
  const isSucceed = await run();
  res.json({
    success: isSucceed,
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
