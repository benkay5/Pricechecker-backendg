import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeJumia(item) {
    try {
        const url = `https://www.jumia.com.ng/catalog/?q=${item}`;
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let prices = [];

        $('.prc').each((i, el) => {
            let txt = $(el).text().replace("₦", "").replace(/,/g, "");
            prices.push(Number(txt));
        });

        // return only the first 15 valid prices
        return prices.filter(x => x > 100).slice(0, 15);

    } catch (err) {
        console.error("Jumia Scrape Error:", err.message);
        return [];
    }
}
