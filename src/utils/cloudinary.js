import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Accessing environment variables
config();
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Configure cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

// Method for uploading
async function uploadOnCloudinary(localFilePath) {
  try {
    if (!localFilePath) {
      throw new Error("Invalid file path");
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      format: "auto",
    });
    console.log(
      `${response.original_filename} has been uploaded to cloudinary`
    );

    // Remove file from disk after uploading
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    // Remove file from disk after failed to upload
    fs.unlinkSync(localFilePath);
    console.error("Failed to upload file:", error);
    return null;
  }
}

export { uploadOnCloudinary };
