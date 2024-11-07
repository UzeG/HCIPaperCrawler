import Crawler from "./Crawler.js";
import SessionCrawler from "./SessionCrawler.js"
import fs from 'node:fs';

(async function () {
    const crawler = new Crawler();
    await crawler.init();
    // const sessionCrawler = new SessionCrawler();
    // await sessionCrawler.init();
    // const data = await sessionCrawler.crawl()
    const data = await crawler.crawl();
    fs.writeFileSync('chi-lbw-2024.json', JSON.stringify(data), 'utf-8');
})();