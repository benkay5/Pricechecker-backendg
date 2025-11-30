import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// Connect DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Price Schema
const PriceSchema = new mongoose.Schema({
    item: String,
    price: Number,
    city: String,
    market: String,
    image: String,
    approved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Price = mongoose.model("Price", PriceSchema);

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

// Get raw prices
app.get("/api/prices", async (req, res) => {
    const item = req.query.item;
    const results = await Price.find({ item, approved: true });
    res.json(results);
});

// Get aggregated prices
app.get("/api/aggregate", async (req, res) => {
    const item = req.query.item;
    const results = await Price.find({ item, approved: true });

    if (results.length === 0) {
        return res.json({ average: 0, count: 0 });
    }

    const avg = results.reduce((a, b) => a + b.price, 0) / results.length;
    res.json({ item, average: avg, count: results.length });
});

// Admin approve
app.post("/api/approve", async (req, res) => {
    const id = req.body.id;
    await Price.findByIdAndUpdate(id, { approved: true });
    res.json({ message: "Approved" });
});

app.listen(process.env.PORT || 10000, () => {
    console.log("Server running...");
});
