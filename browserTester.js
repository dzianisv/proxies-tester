const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// <div class="captcha__human__title" tabindex="0">We want to make sure it is actually you we are dealing with and not a robot.</div>
const waitForElementInFrame = async (page, selector, timeout) => {
    return new Promise((resolve, reject) => {
        let captchaFrame;
        let captchaFrameAttached = false;

        page.on('framenavigated', frame => {
            if (frame.url().startsWith('https://geo.captcha-delivery.com/captcha/')) {
                console.log(__filename, 'attached frame', frame.url());
                captchaFrame = frame;
                captchaFrameAttached = true;
            }
        });

        page.on('framedetached', frame => {
            if (frame === captchaFrame) {
                captchaFrameAttached = false;
            }
        });

        const checkInterval = setInterval(async () => {
            if (captchaFrameAttached) {
                clearInterval(checkInterval);
                console.log(__filename, "waiting for captcha message", selector);
                try {
                    const element = await captchaFrame.waitForFunction(() => {
                        const elements = Array.from(document.querySelectorAll(selector));
                        console.log(__filename, "found elements", elements);
                        return elements.find(e => e.innerText.includes('We want to make sure it is actually you we are dealing with and not a robot.'));
                    }, { timeout });
                    resolve(element);
                } catch (error) {
                    console.log(__filename, "failed to locate captcha message", error);
                    reject(error);
                }
            }
        }, 1000);

        setTimeout(() => {
            clearInterval(checkInterval);
            reject('Timeout');
        }, timeout);
    });
};


async function waitForReadyPage(page, timeout) {
    let element = await Promise.race([
        page.waitForSelector('#email', { timeout }),
        page.waitForFunction(() => {
            const elements = Array.from(document.querySelectorAll('td'));
            return elements.find(e => e.innerText.includes('You have been temporarily blocked to prevent unauthorized use. you have reached the maximum allowed connections, please try later.'));
        }, { timeout }),
        waitForElementInFrame(page, '.captcha__human__title', timeout)
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
    const browser = await puppeteer.launch({ headless: false, args: [`--proxy-server=${proxy.protocol}://${proxy.ip}:${proxy.port}`] });
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