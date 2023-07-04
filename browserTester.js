const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
/*
    let iframe = document.querySelector('iframe[src^="https://geo.captcha-delivery.com"]');
    let element = iframe.contentWindow.document.body.querySelector('.captcha__human__title');
    console.log(element.innerText);
*/
// <div class="captcha__human__title" tabindex="0">We want to make sure it is actually you we are dealing with and not a robot.</div>
async function isGeoCaptchaDeliveryThere(page, timeout) {
    let handle = await page.waitForSelector('iframe[src^="https://geo.captcha-delivery.com"]', {timeout});
    return await handle.contentFrame();
    // TODO: I didn't figure out how to get element from inside the frame
    // const frame = await frameHandle.contentFrame();
    // console.log(__filename, "found geo.captcha-delivery.com iframe");
    // return await frame.waitForSelector('.captcha__human__title');
}

async function waitForReadyPage(page, timeout) {
    let element = await Promise.race([
        page.waitForSelector('#email', { timeout }),
        page.waitForFunction(() => {
            const elements = Array.from(document.querySelectorAll('td'));
            return elements.find(e => e.innerText.includes('You have been temporarily blocked to prevent unauthorized use. you have reached the maximum allowed connections, please try later.'));
        }, { timeout }),
        isGeoCaptchaDeliveryThere(page, timeout)
    ]);

    let message;
    if (message = element.innerText) {
        if (message.includes("You have been temporarily blocked")) {
            throw new Error(message);
        } else {
            console.log(__filename, message);
        }
    }

    return element;
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
    const browser = await puppeteer.launch({ headless: true, args: [`--proxy-server=${proxy.protocol}://${proxy.ip}:${proxy.port}`] });
    const page = await browser.newPage();

    // page load timeout
    await page.goto(test_url, { timeout: 10000 });
    try {
        await waitForReadyPage(page, timeout);
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