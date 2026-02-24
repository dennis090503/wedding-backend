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
  if (num >= 1 && num <= 94) return "Katha";
  if (num >= 95 && num <= 356) return "Baherana";
  if (num >= 357 && num <= 412) return "Dikh";
  if (num >= 413 && num <= 2207) return "Hast Melap";
  if (num >= 2208 && num <= 2667) return "Reception";
  return "Other";
};

const uploadImages = async () => {
  const folderPath = path.join(__dirname, "images");

  const files = fs.readdirSync(folderPath).sort((a, b) => {
    const numA = parseInt(a.match(/image_(\d+)/)?.[1] || 0);
    const numB = parseInt(b.match(/image_(\d+)/)?.[1] || 0);
    return numA - numB;
  });

 for (let file of files) {
  const filePath = path.join(folderPath, file);

  const match = file.match(/image_(\d+)/i);
  const imageNumber = match ? parseInt(match[1]) : null;

  if (!imageNumber) {
    console.log(`Skipping: ${file}`);
    continue;
  }

  // 🔥 Skip already uploaded images
  if (imageNumber <= 2267) {
    console.log(`Already uploaded, skipping: ${file}`);
    continue;
  }
  //  if (!imageNumber) {
  //     console.log(`Skipping: ${file}`);
  //     continue;
  //   }

  const event = getEvent(imageNumber);

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `gallery/${event}`, // better structure
    });

    await Photo.create({
      url: result.secure_url,
      public_id: result.public_id,
      event,
      imageNumber,
    });

    console.log(`Uploaded: ${file} → ${event}`);
  } catch (err) {
    console.log(`Error uploading ${file}`, err);
  }
}

  console.log("All images uploaded!");
  process.exit();
};
console.log("Connecting to:", process.env.MONGODB_URI.split('@')[1]);
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => { // Make this async
    console.log("MongoDB Connected");
    await uploadImages(); // Wait for it to finish
    console.log("Done! Closing connection...");
    process.exit(0); // Exit safely after everything is done
  })
  .catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
  });