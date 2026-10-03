require("dotenv").config();

const dns = require("dns");
// Fix for querySrv ECONNREFUSED on Windows / local ISP DNS blocking SRV lookups
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore if unable to set custom DNS
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Connection Error:", err));

const photoRoutes = require("./routes/photoRoutes");
const authRoutes = require("./routes/authRoutes");
app.use("/photos", photoRoutes);
app.use("/auth", authRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port 5000"));