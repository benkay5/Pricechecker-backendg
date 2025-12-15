import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { runAllScrapers } from "./scrapers/runAll.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* -------------------------------------
   DATABASE CONNECTION
-------------------------------------- */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

/* -------------------------------------
   PRICE SCHEMA + MODEL
-------------------------------------- */
const PriceSchema = new mongoose.Schema({
  item: String,
  price: Number,
  city: String,
  market: String,
  image: String,
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Prevent OverwriteModelError
const Price = mongoose.models.Price || mongoose.model("Price", PriceSchema);

/* -------------------------------------
   ROUTES
-------------------------------------- */

// Health check
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Submit price
app.post("/api/prices", async (req, res) => {
  try {
    const price = new Price(req.body);
    await price.save();
    res.json({ message: "Price submitted, awaiting approval" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get approved prices
app.get("/api/prices", async (req, res) => {
  const item = req.query.item?.toLowerCase();
  const prices = await Price.find({ item, approved: true });
  res.json(prices);
});

// Aggregate prices
app.get("/api/aggregate", async (req, res) => {
  const item = req.query.item?.toLowerCase();
  const prices = await Price.find({ item, approved: true });

  if (!prices.length) {
    return res.json({ average: 0, count: 0 });
  }

  const average =
    prices.reduce((sum, p) => sum + p.price, 0) / prices.length;

  res.json({
    item,
    average,
    count: prices.length
  });
});

// Approve price
app.post("/api/approve", async (req, res) => {
  try {
    await Price.findByIdAndUpdate(req.body.id, { approved: true });
    res.json({ message: "Price approved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------
   SCRAPER ROUTE (SAFE + TIMEOUT)
-------------------------------------- */
function timeoutPromise(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Scraper timeout")), ms)
  );
}

app.get("/api/scrape", async (req, res) => {
  const item = req.query.item?.toLowerCase();
  if (!item) {
    return res.status(400).json({ error: "Item is required" });
  }

  console.log("Scraper started for:", item);

  try {
    const result = await Promise.race([
      runAllScrapers(item),
      timeoutPromise(12000)
    ]);

    res.json({
      success: true,
      result
    });
  } catch (err) {
    console.error("Scraper error:", err.message);
    res.json({
      success: false,
      error: err.message
    });
  }
});

/* -------------------------------------
   START SERVER
-------------------------------------- */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
