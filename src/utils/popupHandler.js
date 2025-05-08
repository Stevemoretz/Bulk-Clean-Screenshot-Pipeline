const { sleep } = require('./sleep');

// Hide cookie consent popups
async function hideCookies(page) {
    await page.evaluate(() => {
        const selector = 'a[id*=cookie i], a[class*=cookie i], button[id*=cookie i], button[class*=cookie i]';
        const expectedText = /^(Accept|Accept all cookies|Accept all|Accept All|Allow|Allow all|Allow All|Allow all cookies|OK)$/gi;
        document.querySelectorAll(selector).forEach(element => {
            if (element.textContent.trim().match(expectedText)) {
                element.click();
            }
        });
    });
    await sleep(500);
}

// Hide general popups and overlays
async function hidePopups(page) {
    await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex, 10);
            const isFixed = style.position === 'fixed' || style.position === 'absolute';
            const isNav = el.tagName.toLowerCase() === 'nav' ||
                el.querySelector('nav, .nav, .navbar, .menu') ||
                el.classList.contains('nav') ||
                el.classList.contains('navbar') ||
                el.classList.contains('menu');
            if (isFixed && !isNaN(zIndex) && zIndex > 0 && !isNav) {
                const ratio = parseInt(style.width) / parseInt(style.height);
                if(!ratio || (ratio < 5/1 && ratio > 1/5)){
                    el.style.display = 'none';
                }
            }
        }
    });
}

module.exports = { hideCookies, hidePopups };
