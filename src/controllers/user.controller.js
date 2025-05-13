import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/apiResponse.js";

// Register user controller
const registerUser = asyncHandler(async (req, res) => {
  // Get user data
  const { fullname, email, username, password } = req.body;

  // Validate user data
  if (
    [fullname, email, username.password].some((field) => field?.trim() === "")
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

export { registerUser };
