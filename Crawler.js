import webdriver from "selenium-webdriver";
const { Builder, By, Key, until } = webdriver;
import chrome from 'selenium-webdriver/chrome.js';

export default class Crawler {
    baseUrl = "https://dl.acm.org";
    getJoinedUrl(path) {
        return this.baseUrl + path
    }

    async init() {
        this.initOption();
        await this.initDriver();
    }

    initOption() {
        this.options = new chrome.Options();
        this.options.addArguments('start-maximized');
        this.options.addArguments('--ignore-certificate-errors');
        this.options.addArguments('--ignore-ssl-errors');
        this.options.addArguments('--disable-blink-features=AutomationControlled');
    }

    async initDriver() {
        this.driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(this.options)
            .build();
    }

    async crawl() {
        await this.driver.get(this.getJoinedUrl('/doi/proceedings/10.1145/3613904'));

        await this.driver.wait(until.elementIsNotVisible(
            // this.driver.findElement(By.css('.accordion-tabbed__content .lazy-loaded'))
            this.driver.findElement(By.id('heading1'))
                .findElement(By.xpath('following-sibling::*[1]'))
                .findElement(By.className('lazy-loaded'))
        ));
        // console.log('heading1 lazy-loaded not visible');

        let count = 100;
        while (count > 0) {
            try {
                await this.driver
                    .findElement(By.id('heading1'))
                    .findElement(By.xpath('following-sibling::*[1]'))
                    .findElement(By.className('lazy-loaded'))
                await this.sleep(0.2);
                count -= 1;
                if (count <= 0) {
                    return await this.driver.close();
                }
                // console.log('count: ', ++count);
            } catch { break; }
        }
        // console.log('heading1 lazy-loaded not visible ====================');

        const items = await this.driver
            .findElement(By.id('heading1'))
            .findElement(By.xpath('following-sibling::*[1]'))
            .findElements(By.className('issue-item-container'));


        const paperUrls = [];

        for (const item of items) {
            const contentEl = await item.findElement(By.css('.issue-item__content-right'));
            const titleAreaEl = await contentEl.findElement(By.css('.issue-item__title a'));
            const url = await titleAreaEl.getAttribute('href');
            paperUrls.push(url);
        }

        console.log(`共有 ${paperUrls.length} 篇 paper`);

        const data = [];
        let i = 0;
        for (const url of paperUrls) {
            // await this.sleep(1);
            // 网页链接
            // console.log(`准备获取 ${url} ...`);
            await this.driver.get(url);

            await this.sleep(1);

            const containerEl = await this.driver.findElement(By.css('header .core-container'));
            // 标题
            const title = await containerEl.findElement(By.css('h1')).getText();
            // 作者
            const authors = [];
            const authorEls = await containerEl.findElements(By.css('.contributors .authors .list span'));
            for (const authorEl of authorEls) {
                const spans = await authorEl.findElements(By.css('.dropBlock a span'));
                let authorFullName = '';
                for (const span of spans) {
                    authorFullName += await span.getText();
                }
                authors.push(authorFullName);
            }

            // 摘要
            const abstract = await this.driver.findElement(By.css('#abstracts .core-container #abstract div')).getText();

            data.push({ url, title, authors, abstract });
            console.log(`已完成获取 ${++i}/${paperUrls.length} 篇 paper 数据`);
        }

        await this.driver.close();
        return data;
    }

    async sleep(s) {
        await this.driver.sleep(s * 1000);
    }
}