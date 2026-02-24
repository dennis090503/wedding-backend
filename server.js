require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const photoRoutes = require("./routes/photoRoutes");
app.use("/photos", photoRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port 5000"));