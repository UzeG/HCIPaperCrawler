import Crawler from "./Crawler.js";
import fs from 'node:fs';

(async function () {
    const crawler = new Crawler();
    await crawler.init();
    const data = await crawler.crawl();
    fs.writeFileSync('chi-lbw-2024.json', JSON.stringify(data), 'utf-8');
})();