const {sleep} = require('./sleep');

// Hide cookie consent popups
async function hideCookies(connectConfig, page) {
    await page.evaluate(() => {
        const selector = 'a[id*=cookie i], a[class*=cookie i], button[id*=cookie i], button[class*=cookie i]';
        const expectedText = /^(Accept|Accept all cookies|Accept all|Accept All|Allow|Allow all|Allow All|Allow all cookies|OK)$/gi;
        document.querySelectorAll(selector).forEach(element => {
            if (element.textContent.trim().match(expectedText)) {
                element.click();
            }
        });
    });
    await sleep(connectConfig.delays.hideCookies || 500);
}

// Hide general popups and overlays
async function hidePopups(connectConfig, page) {
    await page.evaluate(() => {
        // Get screen dimensions
        const screenWidth = window.innerWidth; // Viewport width in pixels
        const screenHeight = window.innerHeight; // Viewport height in pixels
        const screenArea = screenWidth * screenHeight; // Screen surface area in pixels²

// Array to store element data
        const elementData = [];

// Tags to exclude including their children
        const excludeWithChildren = ['SCRIPT', 'PATH', 'SVG', 'IMG', 'A', 'UL', 'LI', 'SPAN', 'INPUT', 'NAV'];

// Tags to exclude without excluding their children
        const excludeWithoutChildren = ['HTML', 'BODY', 'MAIN', 'HEADER', 'FOOTER'];

// Select all elements
        const elements = document.querySelectorAll('*');

// Filter elements and process
        for (const el of elements) {
            // Skip if element is in excludeWithoutChildren
            if (excludeWithoutChildren.includes(el.tagName)) {
                continue;
            }
            // Skip if element or any ancestor is in excludeWithChildren
            if (excludeWithChildren.includes(el.tagName) || el.closest(excludeWithChildren.join(','))) {
                continue;
            }

            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex, 10) || 0; // Fallback to 0 if NaN
            const isFixed = style.position === 'fixed' || style.position === 'absolute';
            const isNav =
                el.tagName.toLowerCase() === 'nav' ||
                el.querySelector('nav, .nav, .navbar, .menu') ||
                el.classList.contains('nav') ||
                el.classList.contains('navbar') ||
                el.classList.contains('menu');

            const width = el.offsetWidth; // Element width in pixels
            const height = el.offsetHeight; // Element height in pixels
            const elementArea = width * height; // Element surface area in pixels²
            const fillRatio = screenArea > 0 ? elementArea / screenArea : 0; // Fill ratio
            const widthRatio = screenWidth > 0 ? width / screenWidth : 0; // Width ratio
            const heightRatio = screenHeight > 0 ? height / screenHeight : 0; // Height ratio
            const aspectRatio = height > 0 ? width / height : 0; // Aspect ratio, avoid division by zero

            if (
                isFixed &&
                aspectRatio &&
                aspectRatio < 5/1 && aspectRatio > 1/5 &&
                zIndex > 0 && !isNav &&
                width > 40 &&
                height > 40 &&
                widthRatio > 0.1 &&
                heightRatio > 0.1
            ) {
                el.style.display = 'none'; // Hide the element
                elementData.push({
                    element: el,
                    tag: el.tagName,
                    width: width,
                    height: height,
                    elementArea: elementArea,
                    fillRatio: fillRatio,
                    widthRatio: widthRatio,
                    heightRatio: heightRatio,
                    zIndex: zIndex,
                    isFixed: isFixed,
                    isNav: isNav
                });
            }
        }

        // Sort by widthRatio in descending order (highest to lowest)
        elementData.sort((a, b) => b.widthRatio - a.widthRatio);

        // Log the entire elementData array
        console.log(elementData);
        // const elements = document.querySelectorAll('*');
        // for (const el of elements) {
        //     const style = window.getComputedStyle(el);
        //     const zIndex = parseInt(style.zIndex, 10);
        //     const isFixed = style.position === 'fixed' || style.position === 'absolute';
        //     const isNav = el.tagName.toLowerCase() === 'nav' ||
        //         el.querySelector('nav, .nav, .navbar, .menu') ||
        //         el.classList.contains('nav') ||
        //         el.classList.contains('navbar') ||
        //         el.classList.contains('menu');
        //     if (isFixed && !isNaN(zIndex) && zIndex > 0 && !isNav) {
        //         const ratio = parseInt(style.width) / parseInt(style.height);
        //         if(!ratio || (ratio < 5/1 && ratio > 1/5)){
        //             el.style.display = 'none';
        //         }
        //     }
        // }
    });
    await sleep(connectConfig.delays.hidePopups || 1);
}

module.exports = {hideCookies, hidePopups};
