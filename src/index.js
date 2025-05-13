import { config } from "dotenv";
import { connectDB } from "./db/index.js";
import { app } from "./app.js";

// Accessing environment variables
config();
const PORT = process.env.PORT || 5000;

// Connecting to database (MongoDB)
connectDB()
  .then(() => {
    app.on("error", () => {
      console.error("Failed to start the server:", error);
    });

    app.listen(PORT, () => {
      console.log("Server is running");
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
  });
