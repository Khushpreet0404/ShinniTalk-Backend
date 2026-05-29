import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      // 401 - unauthorized
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};
