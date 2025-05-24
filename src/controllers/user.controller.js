import { config } from "dotenv";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import {
  deleteAssetOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { APIResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

// Accessing environment variables
config();
const nodeEnvironmentMode = process.env.NODE_ENV;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const cloudinaryFolderName = process.env.CLOUDINARY_FOLDER_NAME;
const cookiesOptions = {
  httpOnly: true,
  secure: nodeEnvironmentMode === "production",
  sameSite: nodeEnvironmentMode === "production" ? "None" : "Lax",
};

// Access and Refresh token generator
async function generateAccessAndRefreshToken(userId) {
  try {
    // Get user from database
    const user = await User.findById(userId);

    // Generate
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Check if tokens are generated successfully
    if (!accessToken || !refreshToken) {
      throw new APIError(500, "Failed to generate tokens");
    }

    // Set refresh token in database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Return tokens
    return { accessToken, refreshToken };
  } catch (error) {
    throw new APIError(
      500,
      error.message || "Something went wrong while generating tokens"
    );
  }
}

// Register user controller
const registerUser = asyncHandler(async (req, res) => {
  // Get user data
  const { fullname, email, username, password } = req.body;

  // Validate user data
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new APIError(400, "All fields are required");
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existingUser) {
    throw new APIError(409, "User already exists with this email or username");
  }

  // Upload images to server's local path
  const avatarLocalPath =
    req.files?.avatar &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
      ? req.files.avatar[0]?.path
      : "";

  const coverImageLocalPath =
    req.files?.coverImage &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
      ? req.files.coverImage[0]?.path
      : "";

  // Upload images to cloudinary
  const avatar = avatarLocalPath && (await uploadOnCloudinary(avatarLocalPath));
  const coverImage =
    coverImageLocalPath && (await uploadOnCloudinary(coverImageLocalPath));

  // Check if avatar image is uploaded successfully
  if (!avatar) {
    throw new APIError(
      400,
      "Avatar image is required, while uploading to Cloudinary"
    );
  }

  // Register a new user
  const user = await User.create({
    fullname: fullname,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
    password: password,
  });

  // Check if user registered successfully
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new APIError(500, "Something went wrong while registering user");
  }

  // Send response back
  res
    .status(201)
    .json(new APIResponse(201, "User registered successfully", createdUser));
});

// Login user controller
const loginUser = asyncHandler(async (req, res) => {
  // Get username/email and password from user input
  const { username, email, password } = req.body;

  // Validate data
  if (!(username || email)) {
    throw new APIError(400, "Username or email is required");
  }
  if (!password) {
    throw new APIError(400, "Password is required");
  }

  // Check if user exists or not
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new APIError(404, "Invalid user credentials");
  }

  // Check if given password is valid or not
  const isValidPassword = await user.isValidPassword(password);
  if (!isValidPassword) {
    throw new APIError(401, "Incorrect password");
  }

  // Generate new access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // Get logged in instance of the user
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Send response back
  res
    .status(200)
    .cookie("accessToken", accessToken, cookiesOptions)
    .cookie("refreshToken", refreshToken, cookiesOptions)
    .json(
      new APIResponse(200, "User logged in successfully", {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

// Logout user controller
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user?._id, {
    $unset: {
      refreshToken: 1,
    },
  });

  res
    .status(200)
    .clearCookie("accessToken", cookiesOptions)
    .clearCookie("refreshToken", cookiesOptions)
    .json(new APIResponse(200, "User logged out successfully", {}));
});

// Refresh access token controller
const refreshAccessToken = asyncHandler(async (req, res) => {
  // Get refresh token from cookies or request body
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  // Check refresh token
  if (!incomingRefreshToken) {
    throw new APIError(401, "Unauthorized request");
  }

  // Verify refresh token
  const decodedRefreshToken = jwt.verify(
    incomingRefreshToken,
    refreshTokenSecret
  );

  // Check decoded refresh token
  if (!decodedRefreshToken) {
    throw new APIError(
      500,
      "Something went wrong while decoding refresh token"
    );
  }

  // Get user
  const user = await User.findById(decodedRefreshToken?._id);

  // Check user
  if (!user) {
    throw new APIError(401, "Invalid refresh token");
  }

  // Generate new tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user?._id
  );

  // Send back response
  res
    .status(200)
    .cookie("accessToken", accessToken, cookiesOptions)
    .cookie("refreshToken", refreshToken, cookiesOptions)
    .json(
      new APIResponse(200, "Refreshed access token successfully", {
        accessToken,
        refreshToken,
      })
    );
});

// Change current password controller
const changeCurrentPassword = asyncHandler(async (req, res) => {
  // Get data from user
  const { currentPassword, newPassword } = req.body;

  // Check if got the current and new password or not
  if (!currentPassword) {
    throw new APIError(400, "Current password is required");
  }
  if (!newPassword) {
    throw new APIError(400, "New password is required");
  }

  // Check if both the current and new password are same or not
  if (currentPassword === newPassword) {
    throw new APIError(400, "Both current and new password are same");
  }

  // Get user data
  const user = await User.findById(req.user?._id);

  // Check if the given current password is correct
  const isValidPassword = await user.isValidPassword(currentPassword);
  if (!isValidPassword) {
    throw new APIError(400, "Invalid current password");
  }

  // Save the new password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  // Send back response
  res
    .status(200)
    .json(new APIResponse(200, "Changed current password successfully", {}));
});

// Get current user controller
const getCurrentUser = asyncHandler((req, res) => {
  // Get current user data
  const currentUser = req.user;

  // Send back response
  res.status(200).json(
    new APIResponse(200, "Fetched current user data successfully", {
      currentUser,
    })
  );
});

// Update user data controller
const updateUserData = asyncHandler(async (req, res) => {
  // Get user inputs
  const { username, fullname, email } = req.body;

  // Check if the given inputs are empty or not
  if (!username) {
    throw new APIError(400, "Username is required");
  }
  if (!fullname) {
    throw new APIError(400, "Fullname is required");
  }
  if (!email) {
    throw new APIError(400, "Email is required");
  }

  // Update the data
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        username,
        fullname,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  // If the user is updated or not
  if (!updatedUser) {
    throw new APIError(400, "Something went wrong while updating user data");
  }

  // Send back response
  res.status(200).json(
    new APIResponse(200, "User data updated successfully", {
      user: updatedUser,
    })
  );
});

// Update avatar image
const updateAvatarImage = asyncHandler(async (req, res) => {
  // Get avatar image from user
  const avatarLocalPath = req.file?.path;

  // Check if received the image or not
  if (!avatarLocalPath) {
    throw new APIError(400, "Avatar image is required");
  }

  // Upload the avatar image to cloudinary
  const updatedAvatar = await uploadOnCloudinary(avatarLocalPath);

  // Check if the image uploaded to cloudinary or not
  if (!updatedAvatar?.url) {
    throw new APIError(
      400,
      "Something went wrong while uploading avatar image"
    );
  }

  // Delete old avatar
  const publicID =
    cloudinaryFolderName +
    req.user?.avatar.split(cloudinaryFolderName)[1].split(".")[0];
  const response = await deleteAssetOnCloudinary(publicID, "image");

  // Update changes in database
  if (response.result === "ok") {
    await User.findByIdAndUpdate(req.user?._id, {
      $set: {
        avatar: updatedAvatar?.url,
      },
    });
  } else {
    throw new APIError(
      400,
      "Something went wrong while deleting old avatar image"
    );
  }

  // Send back response
  res.status(200).json(
    new APIResponse(200, "Avatar image updated successfully", {
      avatar: updatedAvatar?.url,
    })
  );
});

// Update cover image
const updateCoverImage = asyncHandler(async (req, res) => {
  // Get cover image from user
  const coverImageLocalPath = req.file?.path;

  // Check if image is received or not
  if (!coverImageLocalPath) {
    throw new APIError(400, "Cover image is required");
  }

  // Upload the cover image to cloudinary
  const updatedCoverImage = await uploadOnCloudinary(coverImageLocalPath);

  // Check if the image uploaded to cloudinary or not
  if (!updatedCoverImage?.url) {
    throw new APIError(400, "Something went wrong while uploading cover image");
  }

  // Delete old cover image
  const publicID =
    cloudinaryFolderName +
    req.user?.coverImage.split(cloudinaryFolderName)[1].split(".")[0];
  const response = await deleteAssetOnCloudinary(publicID, "image");

  // Update changes in database
  if (response.result === "ok") {
    await User.findByIdAndUpdate(req.user?._id, {
      $set: {
        coverImage: updatedCoverImage?.url,
      },
    });
  } else {
    throw new APIError(
      400,
      "Something went wrong while deleting old cover image"
    );
  }

  // Send back response
  res.status(200).json(
    new APIResponse(200, "Cover image updated successfully", {
      coverImage: updatedCoverImage?.url,
    })
  );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserData,
  updateAvatarImage,
  updateCoverImage,
};
