# Solution Sketch: Automated Screenshot Pipeline

## Objective
Automate capturing clean, 1200px-wide, ≤100KB homepage screenshots for 330+ AI-app pages, free of ads, pop-ups, and age gates, for WordPress integration.

## Solution 1: Puppeteer with uBlock Origin (Headless Browser)
**Description**: Use Puppeteer with Node.js to control headless Chrome, integrated with uBlock Origin for ad blocking. Screenshots are optimized to meet requirements.

**How It Works**:
- **Setup**: Run on a local machine or $5/month VPS (e.g., DigitalOcean). Install Node.js, everything else including uBlock Origin is embedded in my source code.
- **Ad Blocking**: uBlock Origin filters ads automatically.
- **Pop-up/Age Gate Handling**: Custom script hides `fixed`/`absolute` elements with high `z-index` (excluding navs) using aspect ratio filtering. Age gates are bypassed by clicking "Accept" buttons or setting cookies.
- **Screenshot**: Capture full-page screenshots, resize to 1200px width, compress to ≤100KB using `sharp`.
- **Execution**: Process URLs in parallel (e.g., 10 concurrent sessions), saving screenshots to an output folder.

**Cost Estimate (330 pages/month)**:
- **Compute**: Free locally (~4 hours on a modern laptop with parallel processing). $5/month VPS for automation.
- **Tools**: Puppeteer, uBlock Origin, `sharp` are free.
- **Total**: $0 (local) or for automated monthly runs $5/month (VPS).

## Solution 2: Browserless.io API
**Description**: Use Browserless.io’s cloud-based headless browser API for screenshot capture. Inject scripts for ad blocking and popup handling.

**How It Works**:
- **Setup**: Call Browserless.io’s screenshot endpoint with an API token ($25/month plan).
- **Ad Blocking**: Inject a script to block ad domains or use Browserless’s ad-blocker.
- **Pop-up/Age Gate Handling**: Inject the same popup-hiding script as Solution 1. Bypass age gates via cookie injection or button clicks.
- **Screenshot**: API returns 1200px-wide, ≤100KB screenshots.
- **Execution**: Parallel API requests (e.g., 3 concurrent sessions) save screenshots locally.

**Cost Estimate (330 pages/month)**:
- **Compute**: $25/month for 20k units per month (lowest plan, supports 3 concurrent sessions).[](https://www.browserless.io/testing)
- **Total**: $25/month + $0.0020 per unit overages

## Handling Ads, Pop-ups, and Age Gates
- **Solution 1**:
    - **Ads**: uBlock Origin blocks ads comprehensively.
    - **Pop-ups**: Script hides `fixed`/`absolute` elements with high `z-index`, excluding navs, using aspect ratio (provided code). May miss dynamic modals.
    - **Age Gates**: Clicks "Accept" buttons or sets cookies; manual review for failures.
- **Solution 2**:
    - **Ads**: Browserless’s ad-blocker or injected script removes most ads, less effective than uBlock Origin.
    - **Pop-ups**: Same script as Solution 1, executed via API.
    - **Age Gates**: Cookie injection or button clicks, with fallback manual review.

## Comparison Table
| **Criteria**            | **Puppeteer with uBlock Origin**                                         | **Browserless.io API**                      |
|-------------------------|--------------------------------------------------------------------------|---------------------------------------------|
| **Cost (330 pages/month)** | $0 (local) or $5/month (VPS)                                             | $25/month                                   |
| **Speed**               | Fast (~10–15s/page with parallel sessions (limited by system resources)) | Very fast (with 3 parallel sessions)        |
| **Setup Effort**        | Moderate (Node.js, Chrome, uBlock Origin install)                        | Low (API key, minimal scripting)            |
| **Ad/Popup Handling**   | Excellent (uBlock Origin + custom script)                                | Good (API ad-blocker + custom script)       |

## Recommended Option: Puppeteer with uBlock Origin
**Why**:
- **Cost**: Free (Local System) or $5/month (Automated on VPS) vs. $25/month for Browserless.io, a 5x savings for monthly runs.
- **Speed**: Parallel processing (e.g., Infinite concurrent sessions limited by system resources) can make Puppeteer nearly as fast as Browserless.io with a good system/VPS.
- **Control**: uBlock Origin offers superior ad blocking, and local execution allows debugging and customization.
- **Trade-offs**: Moderate setup effort is offset by cost savings and flexibility. Browserless.io’s speed and ease are compelling for frequent runs but not justified for monthly tasks.
