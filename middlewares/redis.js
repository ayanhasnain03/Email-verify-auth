// middleware/redis.js
import { redis } from "../app.js";

export const getCatchedData = (key) => async (req, res, next) => {
  try {
    const data = await redis.get(key);

    if (data) {
      console.log(`Cache hit for key: ${key}`);
      return res.json(JSON.parse(data));
    }

    console.log(`Cache miss for key: ${key}`);
    next(); // Proceed to the route handler if cache miss
  } catch (error) {
    console.error(`Error fetching cached data for key ${key}:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
