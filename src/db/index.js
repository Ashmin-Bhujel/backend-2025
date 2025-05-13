import { config } from "dotenv";
import mongoose from "mongoose";

// Accessing environment variables
config();
const mongoDBUri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const connectionString = `${mongoDBUri}/${dbName}`;

async function connectDB() {
  try {
    const response = await mongoose.connect(connectionString);
    console.log("Successfully connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect with MongoDB:", error);
    process.exit(1);
  }
}

export { connectDB };
