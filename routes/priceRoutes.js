import express from "express";
import Price from "../models/Price.js";

const router = express.Router();

// Add new price
router.post("/add", async (req, res) => {
  try {
    const newPrice = new Price(req.body);
    await newPrice.save();
    res.status(201).json({ message: "Price added", data: newPrice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all prices
router.get("/all", async (req, res) => {
  try {
    const prices = await Price.find().sort({ createdAt: -1 });
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search price by item name
router.get("/search", async (req, res) => {
  try {
    const { item } = req.query;
    const results = await Price.find({
      itemName: { $regex: item, $options: "i" },
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
