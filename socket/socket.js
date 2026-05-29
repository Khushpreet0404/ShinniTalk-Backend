import { Chats } from "../api/models/Chat.Schema.js";
import { Messages } from "../api/models/Message.Schema.js";

// Map of userId -> socketId to track who is currently online
const onlineUsersMap = new Map();

/** Broadcast the current list of online user IDs to every connected client */
const broadcastOnlineUsers = (io) => {
  const onlineUserIds = Array.from(onlineUsersMap.keys());
  io.emit("online_users", onlineUserIds);
};

export const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("user connected", socket.id);

    // Frontend emits this immediately after connecting, passing the logged-in userId
    socket.on("user_connected", (userId) => {
      if (userId) {
        onlineUsersMap.set(userId, socket.id);
        console.log(`User ${userId} is now online`);
        broadcastOnlineUsers(io);
      }
    });

    // Join a specific chat room
    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      console.log(`joined chat ${chatId}`);
    });

    socket.on("send_message", async (data) => {
      try {
        const { sender, content, chats: chatId } = data;
        let newMessages = await Messages.create({
          sender,
          content,
          chats: chatId,
        });
        newMessages = await newMessages.populate("sender", "userName email");
        newMessages = await newMessages.populate("chats");
        await Chats.findByIdAndUpdate(chatId, {
          latestMessage: newMessages._id,
        });

        io.to(chatId).emit("receive_message", newMessages);

      } catch (err) {
        console.log(err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("user disconnected", socket.id);
      // Remove the user from the online map and notify everyone
      for (const [userId, sid] of onlineUsersMap.entries()) {
        if (sid === socket.id) {
          onlineUsersMap.delete(userId);
          console.log(`User ${userId} is now offline`);
          break;
        }
      }
      broadcastOnlineUsers(io);
    });
  });
};
