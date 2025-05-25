const express = require("express");
const usersServices = require("../Services/usersServices");
const genericServices = require("../Services/genericServices");

const router = express.Router();

// ניתוב שמחזיר את כל המשתמשים
router.get("/", async (req, res) => {
  try {
    // console.log(`in get all apartments routes`);
    const users = await genericServices.getAllRecords("users");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ניתוב שמחזיר משתמש לפי מזהה (id)
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const user = await genericServices.getRecordByColumn("users", "user_id", id);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ניתוב שמחזיר משתמש לפי שם משתמש (לצורך התחברות)
router.get("/login", async (req, res) => {
  try {
    const { userName } = req.query;  // מבקש את שם המשתמש
    const user = await usersServices.getUserByUserName(userName);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);  // מחזיר את המידע של המשתמש
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ניתוב ליצירת משתמש חדש
router.post("/", async (req, res) => {
  try {
    const user = req.body;
    const newUser = await genericServices.createRecord("users", user);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ניתוב לבדיקת התחברות משתמש (שם משתמש וסיסמה)
router.post("/login", async (req, res) => {
  try {
    const { userName, password } = req.body;

    const user = await genericServices.getRecordByColumn("users", "user_name", userName);
    if (!user) {
      return res.status(404).json({ error: "Username not found" });
    }

    const realPassword = await genericServices.getRecordByColumn("passwords", "user_id", user.user_id);
    if (realPassword !== password) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;