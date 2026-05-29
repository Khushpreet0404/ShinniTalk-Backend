import { Messages } from "../models/Message.Schema.js";
import { Chats } from "../models/Chat.Schema.js";

export const getMessages = async (req, res, next) => {
  try {
    const {chatId} = req.params;

    const messages = await Messages.find({ chats: chatId })
      .populate("sender", "userName email")
      .populate("chats");

      return res.status(200).json({
        messages:messages
      })

  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { content, chatId } = req.body;
    const sender = req.user.id;

    if (!content || !chatId) {
      return res.status(400).json({
        message: "Content and chatId are required",
      });
    }

    let newMessage = await Messages.create({
      sender,
      content,
      chats: chatId,
    });

    newMessage = await newMessage.populate("sender", "userName email");
    newMessage = await newMessage.populate("chats");

    await Chats.findByIdAndUpdate(chatId, {
      latestMessage: newMessage._id,
    });

    return res.status(200).json(newMessage);
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};
