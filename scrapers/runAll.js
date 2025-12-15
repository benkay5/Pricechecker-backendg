import scrapeJumia from "./jumia.js";
import scrapeKonga from "./konga.js";
import Price from "../models/Price.js";

/* -------------------------------------
   TIMEOUT HELPER
-------------------------------------- */
function timeout(ms, name) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${name} timeout`)), ms)
  );
}

export async function runAllScrapers(item) {
  console.log("runAllScrapers started for:", item);

  const scrapers = [
    { name: "Jumia", fn: scrapeJumia },
    { name: "Konga", fn: scrapeKonga }
  ];

  const collected = [];

  for (const scraper of scrapers) {
    try {
      console.log(`Running ${scraper.name} scraper`);

      const data = await Promise.race([
        scraper.fn(item),
        timeout(8000, scraper.name) // ⏱ 8s per scraper
      ]);

      if (Array.isArray(data)) {
        collected.push(...data);
      }

      console.log(`${scraper.name} finished`);
    } catch (err) {
      console.error(`${scraper.name} failed:`, err.message);
    }
  }

  /* -------------------------------------
     SAVE TO DATABASE
  -------------------------------------- */
  let savedCount = 0;

  for (const p of collected) {
    try {
      await Price.create({
        item: item.toLowerCase(),
        price: p.price,          // ✅ FIX
        city: "online",
        market: p.market || "jumia/konga",
        image: p.image || "",
        approved: true
      });
      savedCount++;
    } catch (err) {
      console.error("DB save error:", err.message);
    }
  }

  console.log("runAllScrapers completed");

  return {
    item,
    scraped: collected.length,
    saved: savedCount
  };
}
