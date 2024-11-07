import webdriver from "selenium-webdriver";
const { Builder, By, Key, until } = webdriver;
import chrome from 'selenium-webdriver/chrome.js';

export default class SessionCrawler {
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

        // handle cookie dialog
        await this.driver.wait(until.elementIsVisible(
            this.driver.findElement(By.id('CybotCookiebotDialog'))
                .findElement(By.id('CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll'))
        ));

        await this.driver.findElement(By.id('CybotCookiebotDialog'))
        .findElement(By.id('CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll'))
        .click();

        this.driver.findElement(By.id('heading1')).click();

        await this.driver.wait(until.stalenessOf(
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

        const bibTex = []

        for (const [index, sessionItem] of sessionItems.entries()) {
            const sessionName = await sessionItem.getText();
            sessionHeading.push(sessionName);

            try{
                const lazyLoad = await sessionItem
                .findElement(By.xpath('following-sibling::*[1]'))
                .findElement(By.className('lazy-loaded'));
            } catch(error) {
                // if (error instanceof StaleElementReferenceError)
                {
                    // 等待元素消失
                    await this.driver.wait.until(until.stalenessOf(lazyLoad));
                }
            }

            const sessionContainer = await sessionItem
            .findElement(By.xpath('following-sibling::*[1]'))
            .findElements(By.className('issue-item-container'));

            let containNum = sessionContainer.length;

            console.log(sessionName + ': ' + containNum);
            

        }

        return bibTex;
    }

    async sleep(s) {
        await this.driver.sleep(s * 1000);
    }
}