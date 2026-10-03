const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const Settings = require("../models/Settings");

// Rate limit: max 5 attempts per IP per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      valid: false,
      rateLimited: true,
      message: "Too many failed attempts. Please try again in 15 minutes.",
    });
  },
});

// POST /auth/verify
router.post("/verify", loginLimiter, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ valid: false, message: "Password is required" });
    }

    let passwordSetting = await Settings.findOne({ key: "gallery_password" });

    let valid = false;
    if (passwordSetting && passwordSetting.value) {
      valid = await bcrypt.compare(password, passwordSetting.value);
    } else {
      // Fallback default password if DB seed has not been run yet
      const defaultPassword = process.env.GALLERY_PASSWORD || "geetawedssagar21022026";
      valid = (password === defaultPassword);
    }

    if (valid) {
      const authToken = Buffer.from(`auth_${Date.now()}`).toString("base64");
      return res.json({ valid: true, token: authToken });
    } else {
      return res.status(401).json({ valid: false, message: "Invalid password." });
    }
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).json({ valid: false, message: "Server error during verification" });
  }
});

module.exports = router;
