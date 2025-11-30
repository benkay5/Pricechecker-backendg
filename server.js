import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { runAllScrapers } from "./scrapers/runAll.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

/* -------------------------------------
   DATABASE CONNECTION
-------------------------------------- */
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB Error:", err));

/* -------------------------------------
   PRICE SCHEMA + MODEL (Overwrite Safe)
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

const Price = mongoose.models.Price || mongoose.model("Price", PriceSchema);

/* -------------------------------------
   ROUTES
-------------------------------------- */

// Default route
app.get("/", (req, res) => {
    res.send("PriceChecker Backend Running");
});

// Submit price
app.post("/api/prices", async (req, res) => {
    try {
        const newPrice = new Price(req.body);
        await newPrice.save();
        res.json({ message: "Price submitted, awaiting approval" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get approved prices (raw)
app.get("/api/prices", async (req, res) => {
    const item = req.query.item?.toLowerCase();
    const results = await Price.find({ item, approved: true });
    res.json(results);
});

// Aggregate price stats
app.get("/api/aggregate", async (req, res) => {
    const item = req.query.item?.toLowerCase();

    const results = await Price.find({ item, approved: true });

    if (results.length === 0) {
        return res.json({ average: 0, count: 0 });
    }

    const avg = results.reduce((a, b) => a + b.price, 0) / results.length;

    res.json({
        item,
        average: avg,
        count: results.length
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
   SCRAPER ROUTE WITH TIMEOUT PROTECTION
-------------------------------------- */

// Promise timeout wrapper
function timeoutPromise(ms, message = "Timeout exceeded") {
    return new Promise((_, reject) =>
        setTimeout(() => reject(new Error(message)), ms)
    );
}

app.get("/api/scrape", async (req, res) => {
    const item = req.query.item?.toLowerCase();
    if (!item) {
        return res.status(400).json({ error: "Item is required" });
    }

    console.log("SCRAPER STARTED for:", item, "at", new Date().toISOString());

    try {
        const result = await Promise.race([
            runAllScrapers(item),
            timeoutPromise(12000, "Scraper took too long")
        ]);

        console.log("SCRAPER FINISHED for:", item);

        res.json({
            success: true,
            message: "Scraping completed",
            result
        });

    } catch (err) {
        console.error("SCRAPER ERROR:", err.message);

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
    console.log("Server running on port " + PORT);
});
