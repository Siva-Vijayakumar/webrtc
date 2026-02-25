const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(express.json());

/* =========================
   In-Memory Metrics Store
========================= */
const metricsStore = {};

/* =========================
   Metrics API Endpoint
========================= */
app.post("/metrics", (req, res) => {
  const { socketId, roomId, data } = req.body;

  if (!metricsStore[roomId]) {
    metricsStore[roomId] = {};
  }

  metricsStore[roomId][socketId] = data;

  io.emit("metrics-update", metricsStore);

  res.json({ status: "ok" });
});

app.get("/metrics", (req, res) => {
  res.json(metricsStore);
});

/* =========================
   Socket Signaling
========================= */

io.on("connection", socket => {

  socket.on("join-room", roomId => {
    socket.join(roomId);

    const users = [...(io.sockets.adapter.rooms.get(roomId) || [])];
    socket.emit("existing-users", users.filter(id => id !== socket.id));

    socket.to(roomId).emit("new-user", socket.id);

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-left", socket.id);
    });
  });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));