const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
/*
    let iframe = document.querySelector('iframe[src^="https://geo.captcha-delivery.com"]');
    let element = iframe.contentWindow.document.body.querySelector('.captcha__human__title');
    console.log(element.innerText);
*/
// <div class="captcha__human__title" tabindex="0">We want to make sure it is actually you we are dealing with and not a robot.</div>
async function isGeoCaptchaDeliveryThere(page, timeout) {
    await page.waitForSelector('iframe[src^="https://geo.captcha-delivery.com"]', {timeout});
    return null;
    // TODO: I didn't figure out how to get element from inside the frame
    // const frame = await frameHandle.contentFrame();
    // console.log(__filename, "found geo.captcha-delivery.com iframe");
    // return await frame.waitForSelector('.captcha__human__title');
}


async function waitForReadyPage(page, selector, timeout) {
    let element = await Promise.race([
        page.waitForSelector(selector, { timeout }),
        page.waitForFunction(() => {
            const elements = Array.from(document.querySelectorAll('td'));
            if (elements.find(e => e.innerText.includes('You have been temporarily blocked to prevent unauthorized use. you have reached the maximum allowed connections, please try later.'))) {
                return false;
            }
        }, { timeout }),
        isGeoCaptchaDeliveryThere(page, timeout)
    ]);

    if (element) {
        return element;
    } else {
        throw new Error("page is not found");
    }
}

/**
 *
 * @param {*} test_url
 * @param {*} selector CSS selector, for example `#email`
 * @param {*} proxy proxy server, for example `http://hostname:port`
 * @param {*} timeout Maximum time to wait in milliseconds. Pass 0 to disable timeout.
 */
async function testProxy(proxy, timeout = 30000, test_url = "", selector = "") {
    console.log(__filename, "testing", proxy);
    puppeteer.use(StealthPlugin());
    const browser = await puppeteer.launch({ /* headless: true ,*/ args: [`--proxy-server=${proxy.protocol}://${proxy.ip}:${proxy.port}`] });
    const page = await browser.newPage();

    // page load timeout
    await page.goto(test_url, { timeout: 10000 });
    try {
        await waitForReadyPage(page, selector, timeout);
    } catch (err) {
        console.log(__filename, proxy, "test failed", err.message);
        return null;
    } finally {
        await browser.close()
    }

    return proxy;
}

module.exports = {
    testProxy
};