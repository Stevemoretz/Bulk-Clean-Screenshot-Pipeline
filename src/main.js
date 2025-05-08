const fs = require('fs').promises;
const path = require('path');
const cliProgress = require('cli-progress');
const merge = require('deepmerge');
const config = require('../config');
const { initializeBrowser, navigatePage, closeBrowser } = require('./browser/browser');
const { waitForCloudflare } = require('./browser/cloudflare');
const { compressImageUntilSize } = require('./image/compressor');
const { hidePopups, hideCookies } = require('./utils/popupHandler');
const { sleep } = require('./utils/sleep');

// Default connect configuration
const defaultConnectConfig = {
    proxy: {
        host: '127.0.0.1',
        port: '10809'
    },
    customConfig: {
        chromePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        args: [
            '--proxy-server=127.0.0.1:10809',
            '--disable-extensions-except=extensions/cjpalhdlnbpafiamejdnhcphjbkeiagm/1.63.2_0',
            '--load-extension=extensions/cjpalhdlnbpafiamejdnhcphjbkeiagm/1.63.2_0'
        ]
    },
    connectOption: { timeout: 1000 }
};

// Capture screenshot for a single URL
async function captureScreenshot(url, domain, outputPath, connectConfig, bar) {
    bar.increment(1, { step: 'Initializing browser' });
    const { browser, page } = await initializeBrowser(connectConfig);
    try {
        bar.increment(1, { step: 'Navigating' });
        await navigatePage(page, url);

        bar.increment(1, { step: 'Waiting for Cloudflare' });
        await waitForCloudflare(page, url);

        try {
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 500 });
        } catch {
            await sleep(500);
        }

        bar.increment(1, { step: 'Hiding popups' });
        await hidePopups(page);

        bar.increment(1, { step: 'Hiding cookies' });
        await hideCookies(page);

        bar.increment(1, { step: 'Final delay' });
        for (let i = 0; i < 15; i++) {
            try {
                await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 1000 });
            } catch {}
            await sleep(50);
        }
        await sleep(connectConfig.minFinalDelay || 0);

        const tempPath = `temp_${domain}.webp`;
        bar.increment(1, { step: 'Capturing screenshot' });
        await page.screenshot({ path: tempPath, fullPage: false });

        bar.increment(1, { step: 'Compressing image' });
        await compressImageUntilSize(tempPath, outputPath);
        await fs.unlink(tempPath);
    } finally {
        await closeBrowser(browser);
    }
}

// Main execution
(async () => {
    const outputDir = 'screenshots';
    await fs.mkdir(outputDir, { recursive: true });

    const enabledWebsites = Object.entries(config.websites).filter(([_, siteConfig]) => siteConfig.enabled);

    for (const [domain, siteConfig] of enabledWebsites) {
        const url = `https://${domain}`;
        const fileName = domain.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const outputPath = path.join(outputDir, `${fileName}.webp`);

        // Create a new progress bar for this website
        const bar = new cliProgress.SingleBar({
            format: 'Processing {domain} [{bar}] {value}/{total} {step}',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        }, cliProgress.Presets.shades_classic);
        bar.start(8, 0, { domain, step: 'Starting' }); // 7 steps: Initialize, Navigate, Cloudflare, Popups, Cookies, Final Delay, Screenshot, Compress

        // Merge global, default, and site-specific connect configs
        const connectConfig = merge.all([
            defaultConnectConfig,
            config.globalConnectConfig,
            siteConfig.connectConfig || {},
            { finalDelay: siteConfig.minFinalDelay || 0 }
        ]);

        try {
            await captureScreenshot(url, domain, outputPath, connectConfig, bar);
            console.log(`Saved to ${outputPath}`);
        } catch (e) {
            console.error(`Failed for ${url}: ${e.message}`);
        } finally {
            bar.stop();
        }
    }
})();
