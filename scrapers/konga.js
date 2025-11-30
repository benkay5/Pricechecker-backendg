import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeKonga(item) {
    try {
        const url = `https://www.konga.com/category/search?q=${item}`;
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let prices = [];

        $('[data-testid="productCardPrice"]').each((i, el) => {
            let txt = $(el).text().replace("₦", "").replace(/,/g, "");
            prices.push(Number(txt));
        });

        return prices.filter(x => x > 100).slice(0, 15);

    } catch (err) {
        console.error("Konga Scrape Error:", err.message);
        return [];
    }
}
