import scrapeJumia from "./jumia.js";
import scrapeKonga from "./konga.js";

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
      console.log(`Running ${scraper.name}`);

      const data = await Promise.race([
        scraper.fn(item),
        timeout(8000, scraper.name)
      ]);

      if (Array.isArray(data)) {
        collected.push(...data);
      }

      console.log(`${scraper.name} finished`);
    } catch (err) {
      console.error(`${scraper.name} failed:`, err.message);
    }
  }

  return {
    item,
    scraped: collected.length,
    results: collected
  };
}
