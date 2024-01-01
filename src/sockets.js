/**
 * Finds or creates a room based on the given user ID.
 * @constructor
 * @param {string} id - The user ID.
 * @returns {Object | { retry: boolean, room: string }} - The room ID or an object indicating a retry.
 * @returns {string | room: string}
 */
/**
 * Generaters random room IDs.
 * @constructor
 * @returns {string: string}
 */
const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 15);
};

/**
 * Handles chat-related events when a socket connection is established.
 *
 * @function
 * @param {SocketIO.Server} io - The Socket.IO server instance.
 */
const chatRooms = {};
const findOrCreateRoom = (activeRooms, id) => {
  for (const room in activeRooms) {
    if (activeRooms[room].length < 2) {
      if (activeRooms[room].includes(id)) {
        return { retry: true, room: room };
      } else {
        return room;
      }
    }
  }
  const newRoom = generateRoomId();
  activeRooms[newRoom] = [];
  return newRoom;
};

const removeUserFromRoom = (activeRooms, id, io, src) => {
  for (const room in activeRooms) {
    const index = activeRooms[room].indexOf(id);
    if (index !== -1) {
      io.to(room).emit(`${src}:leave`, { userId: id, room: room });
      activeRooms[room] = [];

      console.log(`User ${id} disconnected from room ${room}`, activeRooms);
      break;
    }
  }
};

// Chat handlers
const ChatHandles = (io) => {
  io.on("connection", (socket) => {
    console.log("____chat connection instance initiated_____");
    socket.on("chat:userconnected", (data) => {
      if (data.id && !data.recourse) {
        let room = findOrCreateRoom(chatRooms, socket.id);
        room.retry ? (room = room.room) : chatRooms[room].push(socket.id);
        console.log(data.name, "joined the ", room);
        console.log(chatRooms);
        socket.join(room);
        io.to(room).emit("chat:userconnected", { ...data, room });
      }
      if (data.recourse) {
        io.to(data.room).emit("chat:userconnected", { ...data });
      }
    });
    socket.on("chat:chat", (data) => {
      io.to(data.room).emit("chat:chat", data);
    });

    socket.on("chat:typing", (data) => {
      const status = data.state == "on" ? true : false;
      io.to(data.room).emit("chat:typing", { data, state: status });
    });
    socket.on("disconnect", () => {
      console.log("******user disconnected*******", socket.id);
      removeUserFromRoom(chatRooms, socket.id, io, "chat");
      // Handle disconnection logic here
    });
  });
};
const peerRooms = {};

//video room handlers
const VideoHandles = (io) => {
  io.on("connect", (socket) => {
    console.log("========== Video feed instance initiated==============");
    socket.on("video:join", (data) => {
      let room = findOrCreateRoom(peerRooms, socket.id);
      room.retry ? (room = room.room) : peerRooms[room].push(socket.id);
      console.log({ ...data, id: socket.id, peerRooms });
      socket.join(room);
      io.emit("video:join", { ...data, id: socket.id, room });
    });
    socket.on("video:signal", (data) => {
      console.log("######################signal");
      const room = peerRooms[data.room];
      io.to(room[0] == socket.id ? room[1] : room[0]).emit("video:signal", {
        ...data,
        id: socket.id,
      });
    });
    socket.on("video:signal return", (data) => {
      console.log("@@@@@@@@@@@@@@@@@@@return");
      const room = peerRooms[data.room];
      io.to(room[0] == socket.id ? room[1] : room[0]).emit(
        "video:signal return",
        {
          ...data,
          id: socket.id,
        }
      );
    });
    //side chat function
    socket.on("video:chat", (data) => {
      console.log(data);
      const room = peerRooms[data.room];
      io.to(room[0] == socket.id ? room[1] : room[0]).emit("video:chat", {
        ...data,
        id: socket.id,
      });
    });
    socket.on("video:typing", (data) => {
      const room = peerRooms[data.room];
      if (room) {
        const status = data.state == "on" ? true : false;
        io.to(room[0] == socket.id ? room[1] : room[0]).emit("video:typing", {
          data,
          state: status,
        });
      }
    });
    socket.on("disconnect", () => {
      console.log("******user disconnected*******", socket.id);
      removeUserFromRoom(peerRooms, socket.id, io, "video");
    });
  });
};

module.exports = { ChatHandles, VideoHandles };
