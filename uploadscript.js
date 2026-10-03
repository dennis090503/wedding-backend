const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const Photo = require("./models/Photo");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const getEvent = (num) => {
  if (num >= 1082 && num <= 1164) return "Reception";
  if (num >= 1 && num <= 41) return "Katha";        
  if (num >= 42 && num <= 356) return "Baherana";   
  if (num >= 357 && num <= 412) return "Dikh";
  if (num >= 413 && num <= 2207) return "Hast Melap";
  if (num >= 2208 && num <= 3000) return "Reception"; 
  
  return "Other";
};
// --- Helper for Batching ---
async function asyncBatch(taskFunctions, batchSize) {
  const results = [];
  for (let i = 0; i < taskFunctions.length; i += batchSize) {
    const batch = taskFunctions.slice(i, i + batchSize);
    console.log(`Processing batch: ${i / batchSize + 1}...`);
    results.push(...(await Promise.all(batch.map((task) => task()))));
  }
  return results;
}

const uploadImages = async () => {
  const folderPath = path.join(__dirname, "images");

  const files = fs.readdirSync(folderPath).sort((a, b) => {
    const numA = parseInt(a.match(/image_(\d+)/)?.[1] || 0);
    const numB = parseInt(b.match(/image_(\d+)/)?.[1] || 0);
    return numA - numB;
  });

  const uploadTasks = files.map((file) => async () => {
    const filePath = path.join(folderPath, file);
    const match = file.match(/image_(\d+)/i);
    const imageNumber = match ? parseInt(match[1]) : null;

    if (!imageNumber) return;

    const event = getEvent(imageNumber);

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `wedding_gallery/${event}`,
        use_filename: true,
        unique_filename: false,
      });

      await Photo.create({
        url: result.secure_url,
        public_id: result.public_id,
        event,
        imageNumber: Number(imageNumber),
      });

      console.log(`✅ Uploaded [${imageNumber}]`);
    } catch (err) {
      console.error(`❌ FAILED: ${file}`, err.message);
    }
  });

  // Upload 15 images at a time
  await asyncBatch(uploadTasks, 15);
  console.log("--- ALL IMAGES UPLOADED ---");
};

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB. Wiping existing data...");
    await Photo.deleteMany({}); 
    await uploadImages();
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
  });