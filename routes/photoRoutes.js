const express = require("express");
const router = express.Router();
const Photo = require("../models/Photo");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "gallery",
  },
});

const upload = multer({ storage });

// Upload API
router.post("/upload", upload.single("image"), async (req, res) => {
  const photo = new Photo({
    url: req.file.path,
    public_id: req.file.filename,
  });

  await photo.save();
  res.json(photo);
});

// Get images with pagination
router.get("/", async (req, res) => {
  const { page = 1, event } = req.query;
  const limit = 20;

  const query = event && event !== "All" ? { event } : {};

  try {
    const photos = await Photo.find(query)
      .sort({ imageNumber: 1 }) // keep order
      .skip((page - 1) * limit)
      .limit(limit);

    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET /photos?page=1&limit=20
router.get('/photos', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const photos = await Photo.find().skip(skip).limit(limit); // Photo is your model
    const total = await Photo.countDocuments();

    res.json({ photos, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Get photo counts for all categories
// CHANGE THIS:
// app.get("/photo-counts", ...

// TO THIS:
router.get("/counts", async (req, res) => { // Path becomes /photos/counts
  try {
    const counts = await Photo.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          byEvent: [
            { $group: { _id: "$event", count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    const stats = {
      All: counts[0].total[0]?.count || 0
    };

    counts[0].byEvent.forEach(item => {
      if (item._id) stats[item._id] = item.count;
    });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;