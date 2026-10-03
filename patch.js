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

// Updated ranges to include the previously failed "Other" images
const getEvent = (num) => {
  if (num >= 1 && num <= 94) return "Katha";
  if (num >= 95 && num <= 356) return "Baherana";
  if (num >= 357 && num <= 412) return "Dikh";
  if (num >= 413 && num <= 2207) return "Hast Melap";
  if (num >= 2208 && num <= 3000) return "Reception"; 
  return "Other";
};

const patchMissingImages = async () => {
  const folderPath = path.join(__dirname, "images");
  
  // 1. Get all local files
  const allFiles = fs.readdirSync(folderPath);
  
  // 2. Get list of imageNumbers already in MongoDB
  const existingPhotos = await Photo.find({}, "imageNumber");
  const existingNumbers = new Set(existingPhotos.map(p => p.imageNumber));

  // 3. Filter for files NOT in MongoDB
  const missingFiles = allFiles.filter(file => {
    const match = file.match(/image_(\d+)/i);
    const num = match ? parseInt(match[1]) : null;
    return num && !existingNumbers.has(num);
  }).sort((a, b) => {
    const numA = parseInt(a.match(/image_(\d+)/)?.[1] || 0);
    const numB = parseInt(b.match(/image_(\d+)/)?.[1] || 0);
    return numA - numB;
  });

  if (missingFiles.length === 0) {
    console.log("No missing images found. Database is up to date!");
    return;
  }

  console.log(`Found ${missingFiles.length} missing images. Starting patch...`);

  // Process in smaller batches of 5 to ensure stability
  for (let i = 0; i < missingFiles.length; i += 5) {
    const batch = missingFiles.slice(i, i + 5);
    
    await Promise.all(batch.map(async (file) => {
      const filePath = path.join(folderPath, file);
      const imageNumber = parseInt(file.match(/image_(\d+)/i)[1]);
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

        console.log(`✅ Patched [${imageNumber}] -> ${event}`);
      } catch (err) {
        console.error(`❌ FAILED PATCH: ${file}`, err.message);
      }
    }));
  }
};

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB. Scanning for gaps...");
    // Note: We do NOT wipe the database here
    await patchMissingImages();
    console.log("Patching complete.");
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
  });