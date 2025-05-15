import { config } from "dotenv";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";

// Accessing environment variables
config();
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Get access token from cookies or from authorization header
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // Validate access token
    if (!accessToken) {
      throw new APIError(401, "Unauthorized request");
    }

    // Decode the access token
    const decodedToken = jwt.verify(accessToken, accessTokenSecret);

    // Get user data
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    // Check for user
    if (!user) {
      throw new APIError(401, "Invalid access token");
    }

    // Add user to req object
    req.user = user;

    // Pass the control to next
    next();
  } catch (error) {
    throw new APIError(401, error?.message || "Invalid access token");
  }
});

export { verifyJWT };
