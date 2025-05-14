# Automated Screenshot Pipeline

This project captures clean, 1200px-wide, ≤100KB homepage screenshots for websites, free of ads, pop-ups, and cookie banners, using Puppeteer with Brave Browser and uBlock Origin. Screenshots are saved as WebP files in the `screenshots/` folder.

## Installation

1. **Install Node.js**  
   Download and install Node.js (v22 or higher) from [nodejs.org](https://nodejs.org).

2. **Install Brave Browser**  
   Download and install Brave Browser from [brave.com](https://brave.com). (Google Chrome also works, but Brave is preferred for better ad-blocking.)

3. **Install Dependencies**  
   Clone or download this repository, navigate to the project directory, and run:
```bash
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install --no-bin-links
```

4. **Copy Configuration**  
   Copy `config.example.js` to `config.js`:
   ```bash
   cp config.example.js config.js
   ```

5. **Configure Options**  
   Edit `config.js` to set the browser path and website settings. Below is an example based on your current configuration:

   ```javascript
   module.exports = {
       parallelBrowserCount: 2,
       globalConnectConfig: {
           delays: {
               hideCookies: 500,
               hidePopups: 10,
               cloudFlare: {
                   timeout: 60000,
                   maxAttempts: 600,
                   delay: 10,
                   finalDelay: 1000,
                   urlCheckTimeout: 1000
               },
               initialLoadTimeoutDelay: 500,
               secondaryLoadTimeoutAttempts: 15,
               secondaryLoadTimeoutDelay: 50
           },
           headless: false,
           customConfig: {
               chromePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
           }
       },
       websites: {
           "janitorai.com": {
               enabled: true,
               connectConfig: { turnstile: true, headless: false },
               minFinalDelay: 5000
           },
           "character.ai": {
               enabled: true,
               connectConfig: { turnstile: false },
               minFinalDelay: 1000
           },
           "crushon.ai": {
               enabled: true,
               connectConfig: { turnstile: true, headless: false },
               minFinalDelay: 1000
           },
           "createporn.com": {
               enabled: true,
               connectConfig: { turnstile: true },
               minFinalDelay: 1000
           },
           "aichattings.com": {
               enabled: true,
               connectConfig: { turnstile: true },
               minFinalDelay: 1000
           }
       }
   };
   ```

   **Config Options**:
   - **`parallelBrowserCount`** (number): Maximum concurrent browser instances (e.g., 2 for running two sites at once).
   - **`globalConnectConfig`**:
     - `delays` (object): Timing settings for page loading, Cloudflare, pop-ups, and cookies.
     - `headless` (boolean, default: `true`): `true` for no browser UI, `false` to show browser (useful for Cloudflare Turnstile).
     - `customConfig.chromePath` (string): Path to Brave executable, e.g., `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser` (MacOS), `/usr/bin/brave-browser` (Linux), or `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe` (Windows).
   - **`websites`** (object): Per-site settings:
     - `enabled` (boolean): `true` to capture screenshot, `false` to skip.
     - `connectConfig.turnstile` (boolean): `true` if site uses Cloudflare Turnstile, `false` otherwise.
     - `connectConfig.headless` (boolean, optional): Overrides `globalConnectConfig.headless` for the site.
     - `minFinalDelay` (number, default: 1000): Delay (ms) before capturing screenshot to ensure page stability.
     - `connectConfig.mouseMovements` (object, optional): Mouse movement settings:
       - `enabled` (boolean, default: `true`): Enable/disable human-like mouse movements.
       - `scrollProbability` (number, default: 0.15): Chance of scrolling (0 to 1).

6. **Run the Script**  
   Execute the screenshot capture:
   ```bash
   npm run start
   ```

## Features
- Captures 1200px-wide, ≤100KB WebP screenshots.
- Uses uBlock Origin to block ads.
- Hides pop-ups and cookie banners.
- Handles Cloudflare Turnstile with human-like mouse movements (no clicks, scrolls return to top).
- Shows progress bars for each website (9 steps: Starting, Initializing browser, Navigating, Waiting for Cloudflare, Hiding popups, Hiding cookies, Final delay, Capturing screenshot, Compressing image, Success/Failed).

## Troubleshooting
- **Browser not found**: Verify `chromePath` in `config.js`.
- **No screenshots**: Ensure `enabled: true` and try `headless: false` for Turnstile sites.
- **Turnstile issues**: Set `headless: false` to monitor or resolve anti-bot challenges.
- **Large files**: Verify `sharp` is installed (`npm install sharp`).

## Notes
- Brave Browser is recommended for better ad-blocking with uBlock Origin.
- Set `headless: false` for sites with Turnstile (e.g., janitorai.com, crushon.ai) to monitor behavior.
- Adjust `parallelBrowserCount` based on system resources (e.g., 2 for low-memory systems).
