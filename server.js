import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ----------------------------
// Database Connection
// ----------------------------
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/pricechecker";

mongoose
  .connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("DB Error:", err));

// ----------------------------
// Sample Route
// ----------------------------
app.get("/", (req, res) => {
  res.send("Pricechecker Backend Running!");
});

// ----------------------------
// Start Server
// ----------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
