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

    async clearCheckBox() {
        const checkBoxAll = await this.driver
        .findElement(By.id('absSection'))
        .findElement(By.xpath('following-sibling::*[2]'))
        .findElement(By.className('item-results__checkbox'));
        await checkBoxAll.click();
        await checkBoxAll.click();
    }

    async crawl() {
        // await this.driver.get(this.getJoinedUrl('/doi/proceedings/10.1145/3613904'));
        await this.driver.get(this.getJoinedUrl('/doi/proceedings/10.1145/3613905'));

        await this.driver.wait(until.elementIsNotVisible(
            // this.driver.findElement(By.css('.accordion-tabbed__content .lazy-loaded'))
            this.driver.findElement(By.id('heading1'))
                .findElement(By.xpath('following-sibling::*[1]'))
                .findElement(By.className('lazy-loaded'))
        ));
        // console.log('heading1 lazy-loaded not visible');

        const btnCite = await this.driver
        .findElement(By.css('.table-of-content__options.sticky_checkboxes'))
        .findElement(By.css('.btn.light.export-citation'))

        const sessionHeading = [];
        const sessionItems = await this.driver
        .findElement(By.css('.accordion-vport--res.accordion-with-arrow'))
        .findElement(By.css('.accordion-tabbed.rlist'))
        .findElements(By.css('.section__title.accordion-tabbed__control.left-bordered-title'));

        let counter = 0;
        const sessionNum = sessionItems.length;
        const batchSize = 100;
        const bibTex = []

        for (const [index, sessionItem] of sessionItems.entries()) {
            // const sessionName = await sessionItem.getText();
            // console.log(sessionName);
            // sessionHeading.push(sessionName);

            const checkBox = await sessionItem
            .findElement(By.xpath('preceding-sibling::*[1]'));
            try {
                await checkBox.click();
            } catch {
                // handle cookie dialog
                await this.driver.wait(until.elementIsVisible(
                    this.driver.findElement(By.id('CybotCookiebotDialog'))
                        .findElement(By.id('CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll'))
                ));

                await this.driver.findElement(By.id('CybotCookiebotDialog'))
                .findElement(By.id('CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll'))
                .click();

                await checkBox.click();
            }

            if (index % batchSize !== 0 && index !== sessionNum - 1) {
                continue; // 跳过本次循环的后续操作
            }

            let isClickable = false;

            while (!isClickable) {
                try {
                    await btnCite.click();
                    isClickable = true;
                } catch(error) {
                    if (error.name === 'ElementClickInterceptedError') {
                        // 如果元素仍然被遮挡，则向上滚动
                        await this.driver.executeScript("window.scrollBy(0, -500);"); // 向上滚动 100 像素
                    } else {
                        throw error; // 其他错误，抛出
                    }
                }
            }
        
            const cslEntrySelector = By.css('#exportCitation pre .csl-entry');

            // 等待至少一个 csl-entry 元素存在于 DOM 中
            await this.driver.wait(until.elementLocated(cslEntrySelector), 120000);

            const bibItems = await this.driver
            .findElement(By.id('exportCitation'))
            .findElement(By.css('pre'))
            .findElements(By.className('csl-entry'))

            for (const bibItem of bibItems) {
                const text = await bibItem.findElement(By.className('csl-right-inline')).getText();
                bibTex.push(text);
            }

            await this.driver
            .findElement(By.id('exportCitation'))
            .findElement(By.className('close'))
            .click();

            await this.clearCheckBox();
        }

        return bibTex;
        
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