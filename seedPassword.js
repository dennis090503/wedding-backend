require("dotenv").config();
const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Settings = require("./models/Settings");

const seedPassword = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("MONGODB_URI environment variable missing.");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const rawPassword = process.env.INITIAL_PASSWORD || process.argv[2] || "geetawedssagar21022026";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    await Settings.findOneAndUpdate(
      { key: "gallery_password" },
      { key: "gallery_password", value: hashedPassword, updatedAt: new Date() },
      { upsert: true, returnDocument: "after" }
    );

    console.log("Gallery password successfully seeded!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding password:", err);
    process.exit(1);
  }
};

seedPassword();
