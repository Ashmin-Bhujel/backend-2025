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
      resource_type: "auto",
      folder: "backend-2025",
    });

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

// Delete image file
async function deleteAssetOnCloudinary(publicId, assetType = "image") {
  try {
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: assetType,
    });

    return response;
  } catch (error) {
    console.error("Failed to delete the asset:", error);
    return null;
  }
}

export { uploadOnCloudinary, deleteAssetOnCloudinary };
