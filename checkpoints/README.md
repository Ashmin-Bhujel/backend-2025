# 🎯 Checkpoints

## Setting up the project

The goal was to setup a basic project and install required dependencies.

- [x] Create an account for [MongoDB Atlas](https://cloud.mongodb.com/) (An online service for MongoDB).

- [x] Create a new project called `backend-2025` at MongoDB Atlas.

- [x] Create a new cluster inside the project.

- [x] Install the required dependencies to the project (local project directory)

  - [x] Dependencies

    ```sh
    pnpm add express dotenv mongoose
    ```

  - [x] Dev Dependencies

    ```sh
    pnpm add -D nodemon prettier
    ```

- [x] Setup the `.env` file with necessary environment variables.

  ```
  # Express
  PORT=5000

  # Mongoose
  MONGODB_URI="mongodb+srv://<db_username>:<db_password>@<cluster-name>.<cluster-id>.mongodb.net"
  DB_NAME=<db_name>
  ```

- [x] Setup the `.prettierrc` and `.prettierignore` files

  Prettier is used for consistent code formatting all across the project.

  - [x] `.prettierrc`

    ```json
    {
      "tabWidth": 2,
      "bracketSpacing": true,
      "semi": true,
      "singleQuote": false,
      "trailingComma": "es5"
    }
    ```

  - [x] `.prettierignore`

    ```
    node_modules
    .env
    .env.*
    ```

- [x] Create basic folder structure

  - [x] Create `src/` directory and add `index.js` file inside it.

- [x] Test the project setup.

  - [x] `pnpm run dev`

## Connecting to database (MongoDB)

The goal was to connect to the database using mongoose.

- [x] Create `db/` directory inside the `src/` directory.

- [x] Create `index.js` file inside `src/db/` directory.

- [x] Import necessary modules and write a function for connecting to the database.

  ```js
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
  ```

- [x] Test the database connection.

## Configure Some Middlewares

The goal was to configure some essential middlewares for `Express` inside `app.js` file

```js
import { config } from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Accessing environment variables
config();
const corsOrigin = process.env.CORS_ORIGIN;
const app = express();

// Configurations
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
```

### Middlewares

- `cors`: Cross-Origin Resource Sharing is a mechanism that allows restricted resources on a web page to be requested from another domain outside the domain from which the first resource was served.

- `express.json()`: Middleware to parse incoming JSON requests and put the parsed data in `req.body`.

- `express.urlencoded()`: Middleware to parse incoming requests with urlencoded payloads and put the parsed data in `req.body`.

- `express.static()`: Middleware to serve static files from a directory.

- `cookie-parser`: Middleware to parse cookies attached to the client request object.

## `asyncHandler` Method and Some Custom Classes

The goal was to create an `asyncHandler` method and custom classes for `APIError` and `APIResponse`.

- [x] Create `utils/` directory inside the `src/` directory.

- [x] Create `asyncHandler.js` file inside `src/utils/` directory.

  ```js
  const asyncHandler = (handlerFunction) => (req, res, next) =>
    Promise.resolve(handlerFunction(req, res, next)).catch(next);
  ```

- [x] Create `apiError.js` file inside `src/utils/` directory.

  ```js
  class APIError extends Error {
    constructor(
      statusCode,
      message = "Something went wrong!",
      data = null,
      errors = []
    ) {
      super(message);
      this.name = this.constructor.name;
      this.statusCode = statusCode;
      this.data = data;
      this.errors = errors;
      this.success = false;
      Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
      return {
        statusCode: this.statusCode,
        message: this.message,
        data: this.data,
        errors: this.errors,
        success: this.success,
      };
    }
  }
  ```

- [x] Create `apiResponse.js` file inside `src/utils/` directory.

  ```js
  class APIResponse {
    constructor(statusCode, message, data) {
      this.statusCode = statusCode;
      this.message = message;
      this.data = data;
      this.success = statusCode < 400;
    }
  }
  ```

## Create User and Video models

The goal was to create `user` and `video` models using `mongoose`.

### User model

- username
- email
- fullname
- avatar
- coverImage
- watchHistory
- password
- refreshToken

## Video model

- videoFile
- thumbnail
- title
- description
- duration
- views
- isPublished
- owner

**NOTE:** For images and video will be using [Cloudinary](https://cloudinary.com/)

## Setup `bcrypt` and `jwt`

- [x] Install the packages

  ```sh
  pnpm add bcrypt jsonwebtoken
  ```

- [x] Add necessary environment variables

  - Access Token Secret
  - Access Token Expiry
  - Refresh Token Secret
  - Refresh Token Expiry

- [x] Create necessary methods

  - isValidPassword
  - generateAccessToken
  - generateRefreshToken

Also used `pre` hook on save to hash the user password before saving into the database.

## Setup File Uploading Using Cloudinary and Multer

The goal was to install and do basic configurations for cloudinary and multer to work with file uploading.

### Cloudinary

- Add necessary environment variables

  - cloud_name
  - api_key
  - api_secret

- Configure cloudinary

- Create an `uploadOnCloudinary` method

### Multer

- Configure disk storage for multer

## Setup `User` route and controller

The goal was to setup the `User` route and controller.

- [x] Create `userRouter`

- [x] Configured the server to pass on the control to `userRouter` when hitting `/api/v1/user/` route.

- [x] Create controller for `user`

  - Get data from user
  - Validate user data
  - Check if there is existing user with same username and email
  - Check for temporary uploaded image path
  - Upload the images to Cloudinary
  - Get the images URL returned from Cloudinary
  - Create a user object
  - Get the response back

- [x] Test the api using [Postman](https://postman.com) or other API development / testing tool.

## Setup Access and Refresh Token

The goal was to setup the necessary configurations and methods related to access token and refresh token.

- [x] Create middleware for auth.

  - Get access token from cookies or from authorization header
  - Validate and decode access token
  - Get user from database
  - Add user to the request object
  - Pass the control to next

- [x] Create access and refresh token generator.

  - Get user from database
  - Generate new access and refresh token
  - Save generated refresh token in database
  - Return generated tokens

## Setup `/login`, `/logout` and `/refresh-access-token` Routes

- [x] Create `loginUser` controller

  - Get user input
  - Validate data
  - Check if user exists or not
  - Validate password
  - Generate and save new access and refresh token
  - Get instance of logged in user
  - Send response back

- [x] Create `logoutUser` controller

  - Use user data passed on from auth middleware to get and unset refresh token in database
  - Unset cookies and send response back

- [x] Create `refreshAccessToken` controller

  - Get refresh token from cookies or request body
  - Check, verify and decode the refresh token
  - Get user from database
  - Check and match the incoming refresh token and refresh token from database
  - Generate new access and refresh tokens
  - Set new token to cookies and send response back

- [x] Test the api using [Postman](https://postman.com) or other API development / testing tool.
