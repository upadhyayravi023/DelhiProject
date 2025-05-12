require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const router = express.Router();

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  verificationCode: { type: String, default: null },
});

const User = mongoose.model("User", userSchema);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access denied" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// Initialize default user
async function initializeUser() {
  const existingUser = await User.findOne({ email: process.env.COLLEGE_EMAIL });
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash("123", 10);
    const newUser = new User({ email: process.env.COLLEGE_EMAIL, password: hashedPassword });
    await newUser.save();
    console.log("Default user created");
  }
}
initializeUser();

// LOGIN ROUTE
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Invalid Email or Password......" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid Email or Password>>>>" });
  }

  const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ message: "Login Successful", token });
});

// FORGOT PASSWORD ROUTE
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Invalid Email" });
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.verificationCode = verificationCode;
  await user.save();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Verification Code",
    text: `Your verification code is: ${verificationCode}`,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) return res.status(500).json({ message: "Email sending failed" });
    res.json({ message: "Verification code sent to email" });
  });
});

// RESET PASSWORD ROUTE
router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!newPassword || typeof newPassword !== "string") {
    return res.status(400).json({ message: "New password is required" });
  }

  const user = await User.findOne({ email });

  if (!user || user.verificationCode !== code) {
    return res.status(400).json({ message: "Invalid verification code" });
  }

  try {
    user.password = await bcrypt.hash(newPassword, 10);
    user.verificationCode = null;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password", error: error.message });
  }
});

// LOGOUT ROUTE
router.post("/logout", authenticateToken, (req, res) => {
  res.json({ message: "Logout successful" });
});

module.exports = router;
