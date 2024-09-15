import userModel from "../model/user.model.js";
import bycrpt from "bcryptjs";
import { sendVerifyEmail } from "../utils/sendVerifyEmail.js";
import jwt from "jsonwebtoken";
import { redis } from "../app.js";

export const registerUSer = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ msg: "Not all fields have been entered." });

  try {
    const user = await userModel.findOne({ email });
    if (user) return res.status(400).json({ msg: "The email already exists." });

    const salt = await bycrpt.genSalt();
    const passwordHash = await bycrpt.hash(password, salt);
    const newUser = await userModel.create({
      name,
      email,
      password: passwordHash,
      isVerified: false,
    });
    await sendVerifyEmail(newUser);
    res.status(201).json({ msg: "User created successfully." });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ msg: "Not all fields have been entered." });

    const user = await userModel.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ msg: "No account with this email has been registered." });
    const isMatchUser = await bycrpt.compare(password, user.password);
    if (!isMatchUser)
      return res.status(400).json({ msg: "Invalid credentials." });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      msg: "Login successfull",
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const decode = jwt.decode(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decode.id);
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
      res.status(200).json({ msg: "Email verified successfully." });
    }
    res.status(400).json({ msg: "Email already verified." });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const logoutUser = async (req, res) => {
  res.clearCookie("token");
  res.json({ msg: "Logged out successfully." });
};

// Function to get user with caching
export const getUser = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is obtained from req.user
    if (!userId) return res.status(400).json({ msg: "User ID not provided." });

    const key = `user:${userId}`;

    // Start measuring time
    const start = process.hrtime();

    // Check Redis cache
    const cachedUser = await redis.get(key);
    if (cachedUser) {
      console.log(`Cache hit for key: ${key}`);
      const [seconds, nanoseconds] = process.hrtime(start);
      const latency = seconds * 1000 + nanoseconds / 1000000; // Convert to ms
      console.log(`Cache hit latency: ${latency} ms`);
      return res.json(JSON.parse(cachedUser));
    }

    // Fetch from MongoDB
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ msg: "User does not exist." });

    // Prepare user data to send
    const userData = {
      username: user.name,
      email: user.email,
      isVerified: user.isVerified,
    };

    // Cache the result in Redis
    await redis.setex(key, 3600, JSON.stringify(userData)); // Cache for 1 hour

    // End measuring time
    const [endSeconds, endNanoseconds] = process.hrtime(start);
    const totalLatency = endSeconds * 1000 + endNanoseconds / 1000000; // Convert to ms
    console.log(`Cache miss latency: ${totalLatency} ms`);

    res.status(200).json(userData);
  } catch (error) {
    console.error("Error in getUser:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
