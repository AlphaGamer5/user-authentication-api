const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 3000;
let db = null;
const dbPath = path.join(__dirname, "userData.db");

//MiddleWare
app.use(express.json());

//Starting the server and connecting to db
const serverAndDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(PORT, () => {
      console.log(`Server started at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};

serverAndDb();

//API-1: Register a user
app.post("/register/", async (req, res) => {
  const { username, name, password, gender, location } = req.body;
  const userCheckQuery = `
        SELECT *
        FROM user
        WHERE username = "${username}"
    ;`;

  const user = await db.get(userCheckQuery);
  if (user !== undefined) {
    res.status(400);
    res.send("User already exists");
  } else if (password.length < 5) {
    res.status(400);
    res.send("Password is too short");
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
            INSERT INTO user (username, name, password, gender, location)
            VALUES ("${username}", "${name}", "${hashedPassword}", "${gender}", "${location}")
        ;`;

    const newUser = await db.run(query);
    res.send("User created successfully");
  }
});

//API-2: Login a user
app.post("/login/", async (req, res) => {
  const { username, password } = req.body;
  const checkUserQuery = `
        SELECT *
        FROM user
        WHERE username = "${username}"
    ;`;

  const user = await db.get(checkUserQuery);
  if (user === undefined) {
    res.status(400);
    res.send("Invalid user");
  } else {
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (isPasswordCorrect === false) {
      res.status(400);
      res.send("Invalid password");
    } else {
      res.send("Login success!");
    }
  }
});

//API-3: Change password of a user
app.put("/change-password/", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  const checkUserQuery = `
        SELECT *
        FROM user
        WHERE username = "${username}"
    ;`;

  const user = await db.get(checkUserQuery);
  if (user === undefined) {
    res.send("Invalid user");
  } else {
    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    if (isPasswordCorrect === false) {
      res.status(400);
      res.send("Invalid current password");
    } else {
      if (newPassword.length < 5) {
        res.status(400);
        res.send("Password is too short");
      } else {
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        const query = `
                    UPDATE user
                    SET password = "${newHashedPassword}"
                    WHERE username = "${username}"
                ;`;

        const updatedUser = await db.run(query);
        res.send("Password updated");
      }
    }
  }
});

module.exports = app;
