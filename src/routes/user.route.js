import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateUserData,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Register user
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

// User login
router.route("/login").post(loginUser);

// User logout
router.route("/logout").post(verifyJWT, logoutUser);

// Refresh access token
router.route("/refresh-access-token").post(refreshAccessToken);

// Change current password
router.route("/change-current-password").post(verifyJWT, changeCurrentPassword);

// Get current user
router.route("/get-current-user").get(verifyJWT, getCurrentUser);

// Update user data
router.route("/update-user-data").post(verifyJWT, updateUserData);

export default router;
