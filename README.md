# OLX Scraper (no browser drivers)

Scrapes OLX listings with `fetch` + `cheerio` (no Puppeteer/Playwright), and notifies you via a Telegram bot on a schedule.

## Features
- ⚡️ Lightweight HTML scraping (no headless browser)
- ⏰ Cron-based polling via
- 🤖 Telegram push notification
- 🧾 Clean logs via

## Prerequisites
- Node.js **>= 18** (for built-in `fetch`)
- `bun` (optional) if you want to run with Bun
- A Telegram Bot token from [@BotFather](https://t.me/BotFather)

## Installation
```bash
git clone https://github.com/HubertKuch/olx-scraper.git scraper
cd scraper
npm install
# or
bun install
```

## Configuration

Create a `.env` file (see `example.env`):
```env
TELEGRAM_TOKEN=<your_telegram_bot_token>
```

Edit `config.json`:
```json
{
  "url": "https://www.olx.pl/praca/it/",
  "cron": "*/5 * * * *"
}
```
- `url`: OLX offers page to scrape
- `cron`: cron expression for the polling interval (example runs every 5 minutes)

> **Note:** Results are stored in `offers.json` in the project root.

## Run

With Bun:
```bash
bun index.ts
```

With Node:
```bash
npx tsc index.ts && node index.js
```

If everything is set up correctly, you’ll see:
```
ℹ  info      Initializing scraper
```

Open your Telegram bot chat and send `/start`. You should then see logs like:
```
ℹ  info      Setting cron
ℹ  info      Searching for new offers
ℹ  info      Nothing new
```

When new offers are found, you’ll get a Telegram message with the new items. If there is no offers bot tell you `Nothings new`.

## Example Telegram payload
```json
[
  {
    "title": "",
    "link": "https://www.olx.pl/oferta/...",
    "salary": ""
  }
]
```
(Internal fields like `id` are removed from the message.)

## Troubleshooting
- **No messages after `/start`**:
  Ensure `TELEGRAM_TOKEN` is correct and your bot isn’t blocked. Check the console for `Initializing telegram bot`.
- **`fetch` not found**:
  Use Node 18+ or polyfill `fetch`.
- **No new offers ever**:
  OLX markup changes frequently; selectors may need updates. Try logging the raw HTML or inspecting the page.
- **Rate limiting / blocking**:
  Consider increasing the cron interval and keep the `User-Agent`/headers set.

## Legal & Ethical
Scraping may violate a site’s Terms of Service. Use responsibly, respect `robots.txt`, avoid aggressive schedules, and only scrape pages you’re allowed to access.
