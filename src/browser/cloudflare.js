const { sleep } = require('../utils/sleep');

// Wait for Cloudflare Turnstile verification
async function waitForCloudflare(page, url, timeout = 30000) {
    const startTime = Date.now();
    const cloudflareTitlePatterns = ['just a moment', 'verifying you are not a bot', 'checking your browser', 'cloudflare'];
    const cloudflareSelectors = [
        'div.cf-turnstile',
        'input[name="cf-turnstile-response"]',
        'div#cf-wrapper',
        'div.cf-please-wait'
    ].join(', ');

    const hasCloudflare = await page.evaluate(({ selectors, titlePatterns }) => {
        const title = document.title.toLowerCase();
        const regexPatterns = titlePatterns.map(pattern => new RegExp(pattern, 'i'));
        return regexPatterns.some(pattern => pattern.test(title)) || !!document.querySelector(selectors);
    }, { selectors: cloudflareSelectors, titlePatterns: cloudflareTitlePatterns });

    if (!hasCloudflare) return;

    while (Date.now() - startTime < timeout) {
        try {
            await Promise.race([
                page.waitForNavigation({ waitUntil: 'networkidle0', timeout: Math.max(1000, timeout - (Date.now() - startTime)) }),
                page.waitForFunction(
                    selector => {
                        const tokenInput = document.querySelector('input[name="cf-turnstile-response"]');
                        return !document.querySelector(selector) || (tokenInput && tokenInput.value);
                    },
                    { timeout: Math.max(1000, timeout - (Date.now() - startTime)), polling: 500 },
                    cloudflareSelectors
                ),
                page.waitForSelector('div.container, main, body > *:not(script)', {
                    timeout: Math.max(1000, timeout - (Date.now() - startTime))
                })
            ]);

            const isStillCloudflare = await page.evaluate(titlePatterns => {
                const title = document.title.toLowerCase();
                const regexPatterns = titlePatterns.map(pattern => new RegExp(pattern, 'i'));
                return regexPatterns.some(pattern => pattern.test(title));
            }, cloudflareTitlePatterns);

            if (!isStillCloudflare) {
                await sleep(2000); // Wait for stable redirection
                if (!(await page.evaluate(titlePatterns => {
                    const title = document.title.toLowerCase();
                    const regexPatterns = titlePatterns.map(pattern => new RegExp(pattern, 'i'));
                    return regexPatterns.some(pattern => pattern.test(title));
                }, cloudflareTitlePatterns))) {
                    break;
                }
            }
            await sleep(1000);
        } catch {
            await sleep(1000);
        }
    }

    await page.waitForFunction(expectedUrl => window.location.href.includes(expectedUrl), { timeout: 5000 }, url);
}

module.exports = { waitForCloudflare };
