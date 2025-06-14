const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const app = express();
app.use(cors());

const server = app.listen(3001, () => {
  console.log("Server is running on port 3001");
});

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

let player1 = "aaa";
let player2 = "";

//socket.rooms only contains rooms the socket is currently in, not rooms created by others.
//socket.off(eventName) Used to remove all handlers for an event.
//socket.leave(roomName) to remove a socket from a room.

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    if (socket.id === player1) {
      player1 = "";
    } else if (socket.id === player2) {
      player2 = "";
    }
  });

  socket.on("creating_room", (data) => {
    player1 = socket.id;
    socket.join(data);
    socket.emit("player1_joined", player1);
  });

  socket.on("joining_room", (data) => {
    const room = io.sockets.adapter.rooms.get(data); //This line gets the list of players (socket IDs) currently in the room named data.
    const isPresent = room !== undefined;
    if (isPresent) {
      socket.join(data);
      player2 = socket.id;
    }
    socket.emit("player2_found_a_room_or_not", { player: player2, isPresent });
  });

  socket.on("box_clicked", (data) => {
    io.to(data.roomId).emit("box_clicked_response", {
      id: data.id,
      player: player2 === socket.id ? player1 : player2,
      content: player2 === socket.id ? "cross" : "circle",
    });
  });

  socket.on("rematch", (data) => {
    socket.to(data).emit("rematch_confirmation");
  });

  socket.on("rematch_confirmed", (data) => {
    io.to(data).emit("rematch_start");
  });
});
