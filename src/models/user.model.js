import { config } from "dotenv";
import mongoose from "mongoose";
import brcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Accessing environment variables
config();
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: [true, "Fullname is required"],
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // Cloudinary URL
      required: true,
    },
    coverImage: {
      type: String, // Cloudinary URL
    },
    watchHistory: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// Using pre hook for hashing the password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await brcrypt.hash(this.password, 10);
  next();
});

// Method for validating password
userSchema.methods.isValidPassword = async function (password) {
  return await brcrypt.compare(password, this.password);
};

// Method for generating access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      fullname: this.fullname,
      email: this.email,
    },
    accessTokenSecret,
    {
      expiresIn: accessTokenExpiry,
    }
  );
};

// Method for generating refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    refreshTokenSecret,
    {
      expiresIn: refreshTokenExpiry,
    }
  );
};

export const User = mongoose.model("User", userSchema);
