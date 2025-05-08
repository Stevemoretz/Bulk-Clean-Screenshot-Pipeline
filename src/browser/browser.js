const { connect } = require('puppeteer-real-browser');

// Initialize browser with configuration
async function initializeBrowser(connectConfig) {
    const { browser, page } = await connect(connectConfig);
    await page.setViewport({ width: 1200, height: 800 });
    await page.setExtraHTTPHeaders({ 'DNT': '1' });
    return { browser, page };
}

// Navigate to URL and wait for page to stabilize
async function navigatePage(page, url) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    try {
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 3000 });
    } catch {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
}

// Close browser
async function closeBrowser(browser) {
    await browser.close();
}

module.exports = { initializeBrowser, navigatePage, closeBrowser };
