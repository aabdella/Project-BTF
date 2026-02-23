const puppeteer = require('puppeteer-core');

const ITEMS = [
    { ticker: 'BTC-USD',   name: 'Bitcoin',       url: 'https://www.google.com/finance/quote/BTC-USD',      emoji: '₿' },
    { ticker: 'GCW00',     name: 'Gold',           url: 'https://www.google.com/finance/quote/GCW00:COMEX',  emoji: '🥇' },
    { ticker: 'SIW00',     name: 'Silver',         url: 'https://www.google.com/finance/quote/SIW00:COMEX',  emoji: '🥈' },
];

const KITCO = [
    { name: 'Gold',   url: 'https://www.kitco.com/gold-price-today-usa/' },
    { name: 'Silver', url: 'https://www.kitco.com/silver-price-today-usa/' },
];

/** Launch a Puppeteer browser with standard args */
async function launchBrowser() {
    return puppeteer.launch({
        headless: 'new',
        executablePath: '/usr/bin/google-chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800'],
    });
}

/** Create a page with a realistic user agent */
async function newPage(browser) {
    const page = await browser.newPage();
    await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );
    return page;
}

/** Polite delay */
const delay = ms => new Promise(r => setTimeout(r, ms));

/**
 * Fetch price + % change from Google Finance.
 *
 * Root cause of the original bug: `.JwB6zf` and `[jsname="Fe7oBc"]` match
 * *many* elements on the page (related tickers, market movers, etc.).
 * The FIRST match was always BTC's change (+1.02%) regardless of which page
 * was loaded.
 *
 * Fix: scope the selector to within the entity container
 * `[data-last-price]` which wraps only the *main* ticker's data.
 * Extract the sign from the aria-label ("Up by X%" / "Down by X%") so we
 * get a properly signed string.
 */
async function fetchGoogleFinance(page, item) {
    await page.goto(item.url, { waitUntil: 'networkidle2', timeout: 30000 });

    return page.evaluate(() => {
        // The entity container holds data-last-price for the primary ticker
        const entityEl = document.querySelector('[data-last-price]');
        if (!entityEl) return { price: null, change: null };

        // Price
        const priceEl = entityEl.querySelector('.YMlKec.fxKbKc') || entityEl.querySelector('.YMlKec');
        const price = priceEl ? priceEl.innerText.trim() : null;

        // % change — use aria-label for signed value ("Up by 1.87%" / "Down by 2.3%")
        const changeEl = entityEl.querySelector('[jsname="Fe7oBc"]');
        let change = null;
        if (changeEl) {
            const ariaLabel = changeEl.getAttribute('aria-label') || '';
            const m = ariaLabel.match(/(Up|Down) by ([\d.]+)%/i);
            if (m) {
                change = (m[1].toLowerCase() === 'up' ? '+' : '-') + m[2] + '%';
            }
        }

        return { price, change };
    });
}

/**
 * Fetch spot price from Kitco.
 * The bid/spot price lives in an <h3> whose text is a bare number like "5,165.70".
 * Kitco has separate pages for gold and silver.
 */
async function fetchKitcoPrice(page, kitcoItem) {
    try {
        await page.goto(kitcoItem.url, { waitUntil: 'networkidle2', timeout: 45000 });

        const priceText = await page.evaluate(() => {
            const h3s = Array.from(document.querySelectorAll('h3'));
            for (const h3 of h3s) {
                const text = h3.innerText.trim();
                if (/^[\d,]+\.[\d]+$/.test(text)) {
                    return text;
                }
            }
            return null;
        });

        if (!priceText) return null;
        // Normalise to a number (remove commas)
        return parseFloat(priceText.replace(/,/g, ''));
    } catch (e) {
        console.error(`⚠️  Kitco fetch failed for ${kitcoItem.name}: ${e.message}`);
        return null;
    }
}

/** Parse a Google Finance price string like "$5,179.00" or "67,616.72" to float */
function parseGooglePrice(str) {
    if (!str) return null;
    return parseFloat(str.replace(/[^0-9.]/g, ''));
}

/** Compare two prices; return '✅' if within 2%, else '⚠️ Price mismatch detected' */
function validatePrice(googlePrice, kitcoPrice) {
    if (googlePrice == null || kitcoPrice == null) return null;
    const diff = Math.abs(googlePrice - kitcoPrice) / googlePrice;
    return diff > 0.02 ? '⚠️ Price mismatch detected' : '✅';
}

async function fetchPrices() {
    console.log('🦞 Fetching Live Prices (Google Finance + Kitco validation)...');

    // ── Google Finance ──────────────────────────────────────────────────────
    const gfBrowser = await launchBrowser();
    const gfPage = await newPage(gfBrowser);

    const results = {};
    for (const item of ITEMS) {
        try {
            const { price, change } = await fetchGoogleFinance(gfPage, item);
            results[item.name] = { price, change, emoji: item.emoji };
        } catch (e) {
            console.error(`❌ Error fetching ${item.ticker}: ${e.message}`);
            results[item.name] = { price: null, change: null, emoji: item.emoji };
        }
        await delay(2000);
    }

    await gfBrowser.close();

    // ── Kitco validation ────────────────────────────────────────────────────
    const kitcoBrowser = await launchBrowser();
    const kitcoPage = await newPage(kitcoBrowser);

    const kitcoPrices = {};
    for (const kitcoItem of KITCO) {
        kitcoPrices[kitcoItem.name] = await fetchKitcoPrice(kitcoPage, kitcoItem);
        await delay(2000);
    }

    await kitcoBrowser.close();

    // ── Output ──────────────────────────────────────────────────────────────
    console.log('💰 Live Prices:');

    for (const item of ITEMS) {
        const r = results[item.name];
        const priceStr  = r.price  ? r.price  : 'N/A';
        const changeStr = r.change ? `(${r.change})` : '(change N/A)';

        if (item.name === 'Bitcoin') {
            console.log(`${r.emoji} Bitcoin: ${priceStr} ${changeStr}`);
        } else {
            // Gold / Silver — include Kitco cross-reference
            const googleNumeric = parseGooglePrice(r.price);
            const kitcoNum      = kitcoPrices[item.name];
            const status        = validatePrice(googleNumeric, kitcoNum);

            const kitcoStr = kitcoNum
                ? `$${kitcoNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : 'N/A';

            const kitcoSuffix = status
                ? ` | Kitco: ${kitcoStr} ${status}`
                : ` | Kitco: ${kitcoStr}`;

            console.log(`${r.emoji} ${item.name}: ${priceStr} ${changeStr}${kitcoSuffix}`);
        }
    }
}

fetchPrices().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
