# Automated Screenshot Pipeline

This project automates capturing clean, 1200px-wide, ≤100KB homepage screenshots for AI-app websites, free of ads, pop-ups, and age gates, for WordPress integration. It uses Puppeteer with Brave Browser (preferred, though Chrome is supported) and uBlock Origin for ad blocking, handles Cloudflare Turnstile, and processes URLs sequentially with a progress bar. Screenshots are saved as WebP files.

## Prerequisites

- **Node.js**: v22 or higher.
- **Brave Browser** (preferred) or **Google Chrome**: Installed on your system for ad-blocking capabilities via uBlock Origin.
- **npm**: For installing dependencies.
- **System**: MacOS, Linux, or Windows.

## Installation

1. Clone or download this repository.
2. Navigate to the project directory:
   ```bash
   cd screenshot-pipeline
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Edit `config.js` to set up the browser executable path and website-specific settings. The configuration is divided into `globalConnectConfig` for shared settings and `websites` for per-site options.

### Example `config.js`

```javascript
module.exports = {
    "globalConnectConfig": {
        "headless": true,
        "customConfig": {
            // MacOS Brave Path
            "chromePath": "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
            // for Linux change to '/usr/bin/brave-browser' (Brave) or '/usr/bin/google-chrome' (Chrome)
            // for Windows change to 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe' (Brave) or 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' (Chrome)
        }
    },
    "websites": {
        "janitorai.com": {
            "enabled": true,
            "connectConfig": {
                "turnstile": true,
                "headless": false
            },
            "minFinalDelay": 1000
        },
        "character.ai": {
            "enabled": true,
            "connectConfig": {
                "turnstile": false
            },
            "minFinalDelay": 1000
        },
        "crushon.ai": {
            "enabled": true,
            "connectConfig": {
                "turnstile": true,
                "headless": false
            },
            "minFinalDelay": 1000
        },
        "createporn.com": {
            "enabled": true,
            "connectConfig": {
                "turnstile": true
            },
            "minFinalDelay": 1000
        },
        "aichattings.com": {
            "enabled": true,
            "connectConfig": {
                "turnstile": true
            },
            "minFinalDelay": 1000
        }
    }
};
```

### Configuration Options

#### `globalConnectConfig`
Shared settings applied to all websites, unless overridden.

- **`headless`** (boolean, default: `true`):
  - `true`: Runs the browser in headless mode (no visible UI).
  - `false`: Opens a visible browser window, useful for debugging or sites requiring user interaction (e.g., Turnstile).
- **`customConfig`** (object):
  - **`chromePath`** (string): Path to the browser executable.
    - Brave (preferred): e.g., `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser` (MacOS).
    - Chrome: e.g., `/usr/bin/google-chrome` (Linux) or `C:\Program Files\Google\Chrome\Application\chrome.exe` (Windows).
    - Update based on your OS and browser choice.
  - **`args`** (array, optional): Command-line arguments for Puppeteer.
    - Default includes uBlock Origin extension:
      ```javascript
      [
          '--disable-extensions-except=extensions/cjpalhdlnbpafiamejdnhcphjbkeiagm/1.63.2_0',
          '--load-extension=extensions/cjpalhdlnbpafiamejdnhcphjbkeiagm/1.63.2_0'
      ]
      ```
- **`connectOption`** (object, optional):
  - **`timeout`** (number, default: `1000`): Timeout (ms) for browser connection attempts.

#### `websites`
Per-website settings, with each key being a domain (e.g., `janitorai.com`).

- **`enabled`** (boolean):
  - `true`: Include the website in screenshot capture.
  - `false`: Skip the website.
- **`connectConfig`** (object):
  - **`turnstile`** (boolean):
    - `true`: Site uses Cloudflare Turnstile (anti-bot protection). The script waits for Turnstile resolution.
    - `false`: No Turnstile handling needed.
  - **`headless`** (boolean, optional):
    - Overrides `globalConnectConfig.headless` for this site.
    - Set to `false` for sites requiring visible browser (e.g., Turnstile or complex pop-ups).
  - Other properties (e.g., `proxy`, `customConfig`) can override `globalConnectConfig` if needed.
- **`minFinalDelay`** (number):
  - Minimum delay (ms) after hiding pop-ups/cookies, before capturing the screenshot.
  - Ensures page stability (e.g., animations complete).
  - Default: `1000` (1 second).

## Usage

1. Ensure `config.js` is configured with the correct browser path and website settings.
2. Run the screenshot script:
   ```bash
   npm run start
   ```
3. Screenshots are saved in the `screenshots/` folder, named by domain (e.g., `janitorai_com.webp`).

## Features

- **Ad Blocking**: uBlock Origin (loaded via browser extension) removes ads.
- **Pop-up Handling**: Custom script (`hidePopups`) hides fixed/absolute elements (e.g., modals) with high z-index, excluding navigation, using aspect ratio filtering.
- **Cookie Banners**: Script (`hideCookies`) removes cookie consent pop-ups.
- **Cloudflare Turnstile**: Handles anti-bot checks (`waitForCloudflare`) for sites with `turnstile: true`.
- **Output**: 1200px-wide, ≤100KB WebP screenshots, compressed with `sharp`.

## Notes

- **Browser Choice**: Brave is preferred for built-in ad-blocking on top of uBlock, but Chrome works too. Ensure the `chromePath` matches your installed browser.
- **Turnstile Sites**: Sites with `turnstile: true` may require `headless: false` to resolve anti-bot challenges manually.

## Troubleshooting

- **Browser not found**: Verify `chromePath` in `config.js` points to Brave or Chrome.
- **Screenshots missing**: Check `enabled: true` for websites and ensure Turnstile sites render correctly (try `headless: false`).
- **Large file sizes**: Screenshots are compressed to ≤100KB using `sharp`. Ensure `npm install sharp` was successful.
- **Turnstile failures**: Set `headless: false` and watch the browser to resolve anti-bot challenges manually.
- **Extension errors**: Confirm uBlock Origin path in `args` matches your setup.

## Dependencies

- `puppeteer`: Headless browser control.
- `sharp`: Image resizing and compression.
- `uBlock Origin`: Ad blocking (via browser extension).
