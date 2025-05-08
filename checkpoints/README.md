# 🎯 Checkpoints

## Setting up the project

The goal is to setup a basic project and install required dependencies.

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

The goal is to connect to the database using mongoose.

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
      console.log("Host:", response.connection.host);
    } catch (error) {
      console.error("Failed to connect with MongoDB:", error);
      process.exit(1);
    }
  }

  export { connectDB };
  ```

- [x] Test the database connection.
