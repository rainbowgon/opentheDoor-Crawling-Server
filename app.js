import dotenv from "dotenv";

import run from "./modules/informationCrawlers/masterkey/run.js";

dotenv.config({ path: ".env.local" });

const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
// app.use("/public", express.static(__dirname + "/public"));

const server = http.createServer(app);
const PORT = 3000;

app.get("/info/masterkey", async (req, res) => {
  await run();
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
