import { scrapeJumia } from "./jumia.js";
import { scrapeKonga } from "./konga.js";
import Price from "../models/Price.js";  // adjust path if needed

export async function runAllScrapers(item) {
    try {
        const j = await scrapeJumia(item);
        const k = await scrapeKonga(item);

        const merged = [...j, ...k];

        // save to DB
        for (let p of merged) {
            await Price.create({
                item: item.toLowerCase(),
                price: p,
                city: "online",
                market: "jumia/konga",
                approved: true
            });
        }

        return {
            item,
            countSaved: merged.length
        };

    } catch (err) {
        console.error("Scraper Error:", err.message);
        return { item, countSaved: 0 };
    }
}
