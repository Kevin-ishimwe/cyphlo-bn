const express = require("express");
const http = require("http");
const fs = require("fs");
const cors = require("cors");
const { Server } = require("socket.io");
const path = require("path");
const { ChatHandles, VideoHandles } = require("./sockets.js");
const optionsSSL = {
  key: fs.readFileSync(path.join(__dirname, "../cert/selfsigned.key")),
  cert: fs.readFileSync(path.join(__dirname, "../cert/selfsigned.crt")),
};
const app = express();
const dotenv = require("dotenv");
const server = http.createServer(app);

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
