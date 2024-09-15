import express from "express";
import {
  getUser,
  loginUser,
  logoutUser,
  registerUSer,
  verifyEmail,
} from "../controller/auth.controller.js";
import { isAuthenticated } from "../middlewares/authentication.js";

const router = express.Router();

router.post("/register", registerUSer);
router.post("/verify-email/:token", verifyEmail);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

router.get("/me", isAuthenticated, getUser); // Directly using the getUser controller

export default router;
