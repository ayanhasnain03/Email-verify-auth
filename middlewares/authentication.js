import jwt from "jsonwebtoken";
import userModel from "../model/user.model.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        // Specific error messages based on error type
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({
            success: false,
            message: "Unauthorized: Token has expired",
          });
        } else if (err.name === "JsonWebTokenError") {
          return res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid token",
          });
        } else {
          return res.status(401).json({
            success: false,
            message: "Unauthorized: Token verification failed",
          });
        }
      }

      // Check if the token is valid and decode the user ID
      if (!decoded || !decoded.id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid token",
        });
      }

      // Fetch user from the database
      const user = await userModel.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: User not found",
        });
      }

      // Attach user to the request object
      req.user = user;
      next();
    });
  } catch (error) {
    console.error("Authentication error:", error.message);
    res.status(401).json({
      success: false,
      message: "Unauthorized: Token verification failed",
    });
  }
};
