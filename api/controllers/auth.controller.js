import { genToken } from "../../utils/genToken.js";
import { Auth } from "../models/Auth.Schema.js";
import { Messages } from "../models/Message.Schema.js";
import mongoose from "mongoose";

export const signup = async (req, res, next) => {
  try {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const isUserExist = await Auth.findOne({ email });
    if (isUserExist) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const user = await Auth.create({ userName, email, password });
    return res.status(201).json({
      message: "user created successfully",
      data: {
        id: user._id,
        name: user.userName,
        email: user.email,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
};

export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const user = await Auth.findOne({ email });
    console.log(user);
    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Password is incorrect",
      });
    }

    //token
    const token = await genToken(user._id, user.email, user.userName);
    if (!token) {
      return res.status(400).json({
        message: "token is missing",
      });
    }

    return res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 24 * 7 * 60 * 60 * 1000,
      })
      .json({
        message: "user logged in successfully",
        data: {
          id: user._id,
          email: user.email,
          name: user.userName,
        },
      });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

export const logout = async (req, res, next) => {
  try {
    return res
      .status(200)
      .clearCookie("token", {
        httpOnly: true,
        secrue: false,
        sameSite: "strict",
      })
      .json({
        message: "Logout successfully",
      });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await Auth.find({
      _id: { $ne: new mongoose.Types.ObjectId(req.user.id) },
    }).select("-password");

    if (users.length === 0) {
      return res.status(400).json({
        message: "No Users Found",
      });
    }

    return res.status(200).json({
      message: "success",
      data: users,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};
