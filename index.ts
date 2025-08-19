import { load } from "cheerio";
import fs from "fs";
import cron from "node-cron";
import { Telegraf } from "telegraf";
import config from "./config.json";

import type { Offer } from "./types";
import { Signale } from "signale";

const logger = new Signale();

logger.info("Initializing scraper");

const FILE = "offers.json";

function loadOffers() {
  if (fs.existsSync(FILE)) {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  }
  return [];
}

function saveOffers(offers: Offer[]) {
  logger.info("Saving new offers");
  fs.writeFileSync(FILE, JSON.stringify(offers, null, 2), "utf8");
}

async function scrapeOffers(url: string) {
  logger.info("Searching for new offers");

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "pl,en;q=0.9",
      Referer: "https://www.olx.pl/",
    },
  });

  const html = await res.text();
  const $ = load(html);

  const offers: Offer[] = [];

  $("[data-testid='l-card']").each((_, el) => {
    const card = $(el);

    offers.push({
      id: card.attr("id") || "",
      title: card.find("h4").first().text().trim(),
      link: `https://www.olx.pl${card.find("a").first().attr("href") || ""}`,
      salary:
        card
          .find("p")
          .filter((_, el) => $(el).text().includes("zł"))
          .first()
          .text()
          .trim() || null,
    });
  });

  return offers;
}

async function makeOffersChat() {
  const offers = await scrapeOffers(config.url);
  const saved = loadOffers();
  const savedIds = new Set(saved.map((j: Offer) => j.id));
  const newOffers = offers.filter((j: Offer) => !savedIds.has(j.id));

  if (newOffers.length > 0) {
    logger.success(`✅ Found ${newOffers.length} new offers`);

    const updated = [...newOffers, ...saved];

    saveOffers(updated);

    await bot.telegram.sendMessage(
      chatId as number,
      JSON.stringify(
        newOffers.map((offer: Offer) => ({
          ...offer,
          id: undefined,
          refreshedAt: undefined,
        })),
        null,
        2,
      ),
    );

    return;
  }

  await bot.telegram.sendMessage(chatId as number, "Nothings new");
  logger.info("Nothings new");
}

const telegramToken = process.env.TELEGRAM_TOKEN as string;

const bot = new Telegraf(telegramToken);

bot.launch().then((_) => () => {
  logger.info("Initializing telegram bot");
});

let chatId: number | null = null;

bot.command("start", async (ctx) => {
  chatId = ctx.message.chat.id;
  logger.info("Setting cron");

  await ctx.reply(`Setting a cron for chat id: ${chatId}`);

  await makeOffersChat();
});

cron.schedule(config.cron, async () => {
  logger.info("Cron task");
  await makeOffersChat();
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
