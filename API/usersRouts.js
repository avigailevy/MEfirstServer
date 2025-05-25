const express = require("express");
const genericServices = require("../Services/genericServices");
const router = express.Router();

// ניתוב שמחזיר את כל המשתמשים
router.get("/", async (req, res) => {
  try {
    const users = await genericServices.getAllRecords("users");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ניתוב שמחזיר משתמש לפי מזהה (id)
router.get("/:id", async (req, res) => {
  try {
    const user = await genericServices.getRecordByColumn("users", "user_id", req.params.id);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ניתוב שמחזיר משתמש לפי שם משתמש (לצורך התחברות)
router.get("/login", async (req, res) => {
  try {
    const user = await genericServices.getRecordByColumn("users", "user_name", req.query.userName);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ניתוב ליצירת משתמש חדש
router.post("/", async (req, res) => {
  try {
    const newUser = await genericServices.createRecord("users", req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ניתוב לבדיקת התחברות משתמש (שם משתמש וסיסמה)
router.post("/login", async (req, res) => {
  try {
    const user = await genericServices.getRecordByColumn("users", "user_name", req.body.userName);
    if (!user) {
      return res.status(404).json({ error: "Username not found" });
    }

    const realPassword = await genericServices.getRecordByColumn("passwords", "user_id", user.user_id);
    if (realPassword !== req.body.password) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;