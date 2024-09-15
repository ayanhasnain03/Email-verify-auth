import { createTransport } from "nodemailer";
import jwt from "jsonwebtoken";

export const sendVerifyEmail = async (user) => {
  // Determine the token expiration time based on the user's verification status
  const expiresIn = user.isVerified ? "15d" : "3m";

  // Generate the token with the appropriate expiration time
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn,
  });
  if (!token) throw new Error("Error generating token");

  const transporter = createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: user.email,
    subject: "Verify your email",
    text: `${process.env.CLIENT_URL}/auth/verify/${token}`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Error sending verification email");
  }
};
