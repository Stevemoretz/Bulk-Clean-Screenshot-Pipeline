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
    turnstile: true,
    // delays: {
    //     hideCookies: 500,
    //     hidePopups: 10,
    //     cloudFlare: {
    //         timeout: 60000,
    //         maxAttempts: 250,
    //         delay: 20,
    //         finalDelay: 1000,
    //         urlCheckTimeout: 1000,
    //     },
    //     initialLoadTimeoutDelay: 500,
    //     secondaryLoadTimeoutAttempts: 15,
    //     secondaryLoadTimeoutDelay: 50,
    // },
    args: [
        '--disable-extensions-except=extensions/cjpalhdlnbpafiamejdnhcphjbkeiagm/1.63.2_0',
        '--load-extension=extensions/cjpalhdlnbpafiamejdnhcphjbkeiagm/1.63.2_0',
        // '--disable-extensions-except=chrome-extensions/cjpalhdlnbpafiamejdnhcphjbkeiagm/1.63.2_0',
        // '--load-extension=chrome-extensions/cjpalhdlnbpafiamejdnhcphjbkeiagm/1.63.2_0'
    ],
    customConfig: {
        chromePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        // args: [
        //     '--disable-extensions-except=extensions/cjpalhdlnbpafiamejdnhcphjbkeiagm/1.63.2_0',
        //     '--load-extension=extensions/cjpalhdlnbpafiamejdnhcphjbkeiagm/1.63.2_0',
        //     '--disable-extensions-except=chrome-extensions/cjpalhdlnbpafiamejdnhcphjbkeiagm/1.63.2_0',
        //     '--load-extension=chrome-extensions/cjpalhdlnbpafiamejdnhcphjbkeiagm/1.63.2_0'
        // ]
    },
    connectOption: { timeout: 1000 },
    // mouseMovements: {
    //     enabled: true,
    //     scrollProbability: 0.15
    // }
};

// Utility to run tasks with a concurrent queue
async function runConcurrentQueue(tasks, limit) {
    const results = [];
    const queue = [...tasks]; // Copy tasks to process
    const activeTasks = new Set();

    // Function to start a new task if under limit
    async function startNextTask() {
        if (queue.length === 0 || activeTasks.size >= limit) return;

        const task = queue.shift(); // Get next task
        if (!task) return;

        activeTasks.add(task);
        try {
            const result = await task();
            results.push(result);
        } finally {
            activeTasks.delete(task);
            await startNextTask(); // Start next task after one completes
        }
    }

    // Start initial tasks up to the concurrency limit
    await Promise.all(
        Array(Math.min(limit, queue.length))
            .fill()
            .map(() => startNextTask())
    );

    return results;
}

// Capture screenshot for a single URL
async function captureScreenshot(url, domain, outputPath, connectConfig, bar) {
    bar.increment(1, { step: 'Initializing browser' });
    const { browser, page } = await initializeBrowser(connectConfig);
    try {
        bar.increment(1, { step: 'Navigating' });
        await navigatePage(page, url);

        bar.increment(1, { step: 'Waiting for Cloudflare' });
        if (connectConfig.turnstile) {
            await waitForCloudflare(connectConfig, page, url, connectConfig.delays.cloudFlare.timeout);
        }

        try {
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
        } catch {
            await sleep(connectConfig.delays.initialLoadTimeoutDelay || 500);
        }

        bar.increment(1, { step: 'Hiding popups' });
        await hidePopups(connectConfig, page);

        bar.increment(1, { step: 'Hiding cookies' });
        await hideCookies(connectConfig, page);

        bar.increment(1, { step: 'Final delay' });
        for (let i = 0; i < (connectConfig.delays.secondaryLoadTimeoutAttempts || 15); i++) {
            try {
                await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 500 });
            } catch {}
            await sleep(connectConfig.delays.secondaryLoadTimeoutDelay || 50);
        }
        await sleep(connectConfig.minFinalDelay || 0);

        if(connectConfig.clicks){
            for (const action of connectConfig.clicks) {
                if (action.click === 'click') {
                    // Wait for the selector to appear in the DOM
                    await page.waitForSelector(action.selector);
                    // Perform the click
                    await page.click(action.selector);
                    // Wait for the specified delay
                    await sleep(action.delay);
                }
            }
        }

        const tempPath = `temp_${domain}.webp`;
        bar.increment(1, { step: 'Capturing screenshot' });
        await page.screenshot({ path: tempPath, fullPage: false });

        bar.increment(1, { step: 'Compressing image' });
        await compressImageUntilSize(tempPath, outputPath);
        await fs.unlink(tempPath);

        bar.increment(1, { step: 'Success' }); // Final tick for success
    } catch (e) {
        bar.increment(1, { step: `Failed: ${e.message}` }); // Final tick for failure
        throw e; // Re-throw to maintain result tracking
    } finally {
        await closeBrowser(browser);
    }
}

// Main execution
(async () => {
    const outputDir = 'screenshots';
    await fs.mkdir(outputDir, { recursive: true });

    const enabledWebsites = Object.entries(config.websites).filter(([_, siteConfig]) => siteConfig.enabled);

    // Create a multi-bar for progress tracking
    const multibar = new cliProgress.MultiBar({
        format: 'Processing {domain} [{bar}] {value}/{total} {step}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    }, cliProgress.Presets.shades_classic);

    // Concurrency limit (adjust based on system resources)
    const CONCURRENCY_LIMIT = config.parallelBrowserCount;

    // Map websites to tasks
    const tasks = enabledWebsites.map(([domain, siteConfig]) => async () => {
        const url = `https://${domain}`;
        const fileName = domain.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const outputPath = path.join(outputDir, `${fileName}.webp`);

        // Create a progress bar for this website (9 steps to include final status)
        const bar = multibar.create(9, 0, { domain, step: 'Starting' });

        // Merge global, default, and site-specific connect configs
        const connectConfig = merge.all([
            defaultConnectConfig,
            config.globalConnectConfig,
            siteConfig.connectConfig || {},
            { finalDelay: siteConfig.minFinalDelay || 0 }
        ]);

        try {
            await captureScreenshot(url, domain, outputPath, connectConfig, bar);
            return { domain, status: 'success', outputPath };
        } catch (e) {
            return { domain, status: 'failed', error: e.message };
        } finally {
            bar.stop();
        }
    });

    // Execute tasks with concurrent queue
    await runConcurrentQueue(tasks, CONCURRENCY_LIMIT);

    // Stop the multi-bar
    multibar.stop();
})();
