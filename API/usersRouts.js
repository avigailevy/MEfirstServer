const express = require("express");
const usersServices = require("../Services/usersServices");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    console.log(`in get all users routes`);
    const users = await usersServices.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});