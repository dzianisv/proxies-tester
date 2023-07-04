const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

/**
 *
 * @param {*} test_url
 * @param {*} selector CSS selector, for example `#email`
 * @param {*} proxy proxy server, for example `http://hostname:port`
 * @param {*} timeout Maximum time to wait in milliseconds. Pass 0 to disable timeout.
 */
async function testProxy(proxy, timeout = 30000, test_url="", selector="") {
    puppeteer.use(StealthPlugin());
    const browser = await puppeteer.launch({ headless: false, args: [ `--proxy-server=${proxy.protocol}://${proxy.ip}:${proxy.port}`] });
    const page = await browser.newPage();

    await page.goto(test_url);
    //https://pptr.dev/api/puppeteer.page.waitforselector
    try {
        await page.waitForSelector(selector, {timeout});
    } catch(err) {
        console.log(__filename, selector, "not found");
        return null;
    } finally {
        await browser.close()
    }

    return proxy;
}

module.exports = {
    testProxy
};