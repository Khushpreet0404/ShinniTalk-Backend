import { Chats } from "../models/Chat.Schema.js";

export const createChat = async (req, res, next) => {
  try {
    let { users, isGroupChat, chatName } = req.body;
    const loggedinUser = req.user.id;
    if (!users || users.length === 0) {
      return res.status(400).json({
        message: "Users are required",
      });
    }
    // private chats:
    if (!isGroupChat) {
      // Extract the target other user's ID
      const otherUserId = users[0];

      // Beginner Comment:
      // Why duplicate chats were happening:
      // The previous MongoDB query used '$expr' with '{ size: "$users" }'. In MongoDB,
      // the array size operator must be prefixed with a dollar sign: '$size'. Without it,
      // MongoDB could not parse the expression correctly, causing the query to never find
      // existing private chats and always creating new ones.
      //
      // How existing chat reuse works:
      // We look for a chat where:
      // 1. 'isGroupChat' is false (it's a 1-on-1 private chat).
      // 2. 'users' contains both the current logged-in user and the other user ($all).
      // 3. 'users' has an exact length of 2 ($size: 2), which guarantees it is a private chat
      //    between exactly these two participants.
      let chatExist = await Chats.findOne({
        isGroupChat: false,
        users: {
          $all: [otherUserId, loggedinUser],
          $size: 2,
        },
      })
        .populate("users", "-password")
        .populate("latestMessage");

      // If an active private chat already exists between these 2 users, reuse it!
      if (chatExist) {
        return res.status(200).json(chatExist);
      }

      // If no chat exists, create a new private chat document
      const chat = await Chats.create({
        chatName: "Private_Chat",
        isGroupChat: false,
        users: [otherUserId, loggedinUser],
      });

      const newChat = await Chats.findById(chat._id).populate(
        "users",
        "-password",
      );
      return res.status(200).json(newChat);
    }

    // group chats:
    users.push(loggedinUser);
    const groupChat = await Chats.create({
      chatName,
      isGroupChat,
      users,
      groupAdmin: loggedinUser,
    });

    const newGroupChat = await Chats.findById(groupChat._id).populate(
      "users",
      "-password",
    );
    return res.status(200).json(newGroupChat);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

export const getChats = async (req, res, next) => {
  try {
    const loggedinUser = req.user.id;
    // Find all chats (private or group) where the current user is a participant
    const chats = await Chats.find({
      users: { $elemMatch: { $eq: loggedinUser } }
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "userName email"
        }
      })
      .sort({ updatedAt: -1 }); // Sort by latest activity first

    return res.status(200).json(chats);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};
