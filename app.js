import dotenv from "dotenv";

const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const app = express();

dotenv.config({ path: ".env.local" });

app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public", express.static(__dirname + "/public"));

const server = http.createServer(app);
const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
