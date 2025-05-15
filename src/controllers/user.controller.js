import { config } from "dotenv";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/apiResponse.js";

// Accessing environment variables
config();
const nodeEnvironmentMode = process.env.NODE_ENV;
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
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  res
    .status(200)
    .clearCookie("accessToken", cookiesOptions)
    .clearCookie("refreshToken", cookiesOptions)
    .json(new APIResponse(200, "User logged out successfully", {}));
});

export { registerUser, loginUser, logoutUser };
