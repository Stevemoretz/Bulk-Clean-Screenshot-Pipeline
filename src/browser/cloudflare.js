const { sleep } = require('../utils/sleep');

// Helper function to generate a random number within a range
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to simulate smooth mouse movement using a Bezier curve
async function smoothMouseMove(page, startX, startY, endX, endY, steps = 30) {
    const points = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // Quadratic Bezier curve with two control points for natural curvature
        const controlX1 = startX + (endX - startX) * 0.3 + getRandomInt(-75, 75);
        const controlY1 = startY + (endY - startY) * 0.3 + getRandomInt(-75, 75);
        const controlX2 = startX + (endX - startX) * 0.7 + getRandomInt(-75, 75);
        const controlY2 = startY + (endY - startY) * 0.7 + getRandomInt(-75, 75);
        // Cubic Bezier formula
        const x = (1 - t) ** 3 * startX +
            3 * (1 - t) ** 2 * t * controlX1 +
            3 * (1 - t) * t ** 2 * controlX2 +
            t ** 3 * endX;
        const y = (1 - t) ** 3 * startY +
            3 * (1 - t) ** 2 * t * controlY1 +
            3 * (1 - t) * t ** 2 * controlY2 +
            t ** 3 * endY;
        points.push({ x: Math.round(x), y: Math.round(y) });
    }

    for (const point of points) {
        await page.mouse.move(point.x, point.y);
        await sleep(getRandomInt(20, 50)); // Slower, natural movement
    }
}

// Helper function to simulate human-like mouse movements without clicks
async function simulateHumanMouse(page, connectConfig) {
    const viewport = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight
    }));

    // Focus movements in the central 60% of the viewport
    const centerX = viewport.width * 0.2;
    const centerY = viewport.height * 0.2;
    const maxX = viewport.width * 0.8;
    const maxY = viewport.height * 0.8;

    // Perform 1–2 movements
    const movementCount = getRandomInt(1, 2);
    for (let i = 0; i < movementCount; i++) {
        let startX = getRandomInt(centerX, maxX);
        let startY = getRandomInt(centerY, maxY);
        let endX = startX + getRandomInt(-150, 150);
        let endY = startY + getRandomInt(-150, 150);

        // Occasionally overshoot and correct
        if (Math.random() < 0.3) {
            const overshootX = endX + getRandomInt(-50, 50);
            const overshootY = endY + getRandomInt(-50, 50);
            await smoothMouseMove(
                page,
                startX,
                startY,
                Math.max(centerX, Math.min(overshootX, maxX)),
                Math.max(centerY, Math.min(overshootY, maxY)),
                30
            );
            startX = overshootX;
            startY = overshootY;
        }

        // Move to final target
        await smoothMouseMove(
            page,
            startX,
            startY,
            Math.max(centerX, Math.min(endX, maxX)),
            Math.max(centerY, Math.min(endY, maxY)),
            30
        );

        // // Occasional scroll with return to top
        // if (Math.random() < (connectConfig.mouseMovements?.scrollProbability || 0.15)) {
        //     const scrollAmount = getRandomInt(50, 150); // Small scroll
        //     for (let j = 0; j < scrollAmount; j += 10) {
        //         await page.mouse.wheel({ deltaY: 10 });
        //         await sleep(getRandomInt(10, 30));
        //     }
        //     // Scroll back to top
        //     await page.evaluate(() => window.scrollTo(0, 0));
        // }
    }
}

// Wait for Cloudflare Turnstile verification
async function waitForCloudflare(connectConfig, page, url, timeout = 30000) {
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

    // Perform initial mouse movement concurrently with a short delay
    if (connectConfig.mouseMovements?.enabled !== false) {
        await Promise.all([
            simulateHumanMouse(page, connectConfig),
            sleep(200) // Minimal delay to ensure page stability
        ]);
    }

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

            const checkCloudflare = async (maxAttempts = 5, delay = 200) => {
                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    const isCloudflare = await page.evaluate(patterns => {
                        const title = document.title.toLowerCase();
                        return patterns
                            .map(pattern => new RegExp(pattern, 'i'))
                            .some(regex => regex.test(title));
                    }, cloudflareTitlePatterns);

                    if (isCloudflare) return false;
                    // Run mouse movements concurrently with delay
                    if (connectConfig.mouseMovements?.enabled !== false) {
                        await Promise.all([
                            simulateHumanMouse(page, connectConfig),
                            sleep(delay)
                        ]);
                    } else {
                        await sleep(delay);
                    }
                }
                return true;
            };

            if (await checkCloudflare(connectConfig.delays.cloudFlare.maxAttempts || 500, connectConfig.delays.cloudFlare.delay || 10)) {
                // Scroll to top before breaking
                await page.evaluate(() => window.scrollTo(0, 0));
                break;
            }

            // Run mouse movements concurrently with final delay
            if (connectConfig.mouseMovements?.enabled !== false) {
                await Promise.all([
                    simulateHumanMouse(page, connectConfig),
                    sleep(connectConfig.delays.cloudFlare.finalDelay || 1000)
                ]);
            } else {
                await sleep(connectConfig.delays.cloudFlare.finalDelay || 1000);
            }
        } catch {
            // Run mouse movements concurrently with error delay
            if (connectConfig.mouseMovements?.enabled !== false) {
                await Promise.all([
                    simulateHumanMouse(page, connectConfig),
                    sleep(connectConfig.delays.cloudFlare.finalDelay || 1000)
                ]);
            } else {
                await sleep(connectConfig.delays.cloudFlare.finalDelay || 1000);
            }
        }
    }

    await page.waitForFunction(expectedUrl => window.location.href.includes(expectedUrl), { timeout: connectConfig.delays.cloudFlare.urlCheckTimeout || 10000 }, url);
}

module.exports = { waitForCloudflare };
