import mongoose from "mongoose";

const PriceSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    marketName: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    unit: { type: String, default: "per unit" },
  },
  { timestamps: true }
);

export default mongoose.model("Price", PriceSchema);
