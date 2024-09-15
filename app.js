import express from "express";
import dotenv from "dotenv"; // Import dotenv
import connectDb from "./utils/db.js";
import authRouter from "./router/authRouter.js";
import cookieParser from "cookie-parser";
import Redis from "ioredis";

dotenv.config(); // Initialize dotenv to use environment variables

const app = express();

// Initialize Redis client
export const redis = new Redis({
  host: process.env.REDIS_HOST, // Redis host
  port: parseInt(process.env.REDIS_PORT, 10), // Redis port (ensure it's an integer)
  password: process.env.REDIS_PASSWORD || undefined, // Password (if any)
});

// Handle Redis connection events
redis.on("connect", () => {
  console.log("Redis connected successfully");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

// Connect to MongoDB
connectDb();

// Middleware for parsing JSON
app.use(express.json());

// Initialize cookie parser middleware
app.use(cookieParser());

// Define a test route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Use the authentication router
app.use("/auth", authRouter);

// Start the server
const port = process.env.PORT || 3000; // Default to 3000 if PORT is not set
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
