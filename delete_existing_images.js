const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const deleteAllImages = async () => {
  try {
    // Delete all resources inside "gallery" folder
    const result = await cloudinary.api.delete_resources_by_prefix("gallery/");
    
    // Delete empty folder
    await cloudinary.api.delete_folder("gallery");

    console.log("All images deleted:", result);
  } catch (err) {
    console.error(err);
  }
};

deleteAllImages();