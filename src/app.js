import { config } from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Accessing environment variables
config();
const corsOrigin = process.env.CORS_ORIGIN;
const app = express();

// Middleware configurations
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

export { app };
