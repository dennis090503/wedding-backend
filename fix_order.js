const mongoose = require("mongoose");
require("dotenv").config();
const Photo = require("./models/Photo");

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Fixing range: Moving images 42-94 from Katha to Baherana...");

    const result = await Photo.updateMany(
      { 
        imageNumber: { $gte: 42, $lte: 94 } 
      },
      { 
        $set: { event: "Baherana" } 
      }
    );

    console.log(`Successfully updated ${result.modifiedCount} photos.`);
    process.exit(0);
  })
  .catch(err => {
    console.error("Error updating database:", err);
    process.exit(1);
  });