const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", socket => {

  socket.on("join-room", roomId => {
    socket.join(roomId);

    const users = [...(io.sockets.adapter.rooms.get(roomId) || [])];
    socket.emit("existing-users", users.filter(id => id !== socket.id));

    socket.to(roomId).emit("new-user", socket.id);

    socket.on("offer", ({ offer, to }) => {
      socket.to(to).emit("offer", { offer, from: socket.id });
    });

    socket.on("answer", ({ answer, to }) => {
      socket.to(to).emit("answer", { answer, from: socket.id });
    });

    socket.on("ice-candidate", ({ candidate, to }) => {
      socket.to(to).emit("ice-candidate", { candidate, from: socket.id });
    });

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-left", socket.id);
    });

  });

});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));