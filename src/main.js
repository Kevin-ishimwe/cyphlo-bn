const express = require("express");
const http = require("https");
const fs = require("fs");
const cors = require("cors");
const { Server } = require("socket.io");
const path = require("path");
const { ChatHandles, VideoHandles } = require("./sockets.js");
const optionsSSL = {
  key: fs.readFileSync(path.join(__dirname, "../cert/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "../cert/cert.pem")),
};
const app = express();
const dotenv = require("dotenv");
const server = http.createServer(optionsSSL, app);

dotenv.config();

const handleSocketfunction = async () => {
  try {
    const io = new Server(server, {
      cors: true,
    });
    //namespaces
    await ChatHandles(io.of("/chat"));
    await VideoHandles(io.of("/video"));
  } catch (e) {
    console.log(e);
    io.close();
    setTimeout(handleChatFunction, 5000);
  }
};
handleSocketfunction();
const PORT = process.env.PORT || 3000;
app.use("/", (req, res) => {
  res.json({ message: "root" });
});
server.listen(PORT, () => {
  console.log(`listening on https://hostpath:*:${PORT}`);
});
