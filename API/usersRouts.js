const express = require("express");
const genericServices = require("../Services/genericServices");
const { hashPassword } = require("../Services/passwordServices");
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
    const user = await genericServices.getRecordByColumn("users", "username", req.query.username);

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
    // בדיקת שדות חובה
    const { user_id, username, role, email, phone, address } = req.body;
    if (!user_id || !username || !role || !email || !phone || !address) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const newUser = await genericServices.createRecord("users", req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ניתוב לבדיקת התחברות משתמש (שם משתמש וסיסמה)
router.post("/login", async (req, res) => {
  try {
    const user = await genericServices.getRecordByColumn("users", "username", req.body.username);
    if (!user) {
      return res.status(404).json({ error: "Username not found" });
    }

    // שליפת הסיסמה מהטבלה המתאימה
    const realPassword = await genericServices.getRecordByColumn("passwords", "user_id", user.user_id);

    if (!realPassword) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // בדיקת סיסמה אמיתית מול ה-hash וה-salt
    const { password_hash } = hashPassword(req.body.password, realPassword.password_salt);

    if (password_hash !== realPassword.password_hash) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;