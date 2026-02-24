const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  public_id: {
    type: String,
    required: true,
  },
  event: {
    type: String,
    enum: ["Katha", "Baherana", "Dikh", "Hast Melap", "Reception"],
  },
  imageNumber: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast filtering
photoSchema.index({ event: 1 });

module.exports = mongoose.model("Photo", photoSchema);