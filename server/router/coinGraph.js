const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const { findMatchingCoin } = require("./helpers/coin_finder");

const coinHistoryRouter = express.Router();
let weeklyCache = {};
let monthlyCache = {};

const cacheExpiration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function getThisDateMDY() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  return `${year}-${month}-${day}`;
}

async function isJsonHistoryFileExist(date, coin) {
  try {
    await fs.access(
      path.join(__dirname, `../aggregation/history/${date}_${coin}.json`)
    );
    return true;
  } catch {
    return false;
  }
}

async function saveHistoryInJsonFile(history, coin) {
  const date = getThisDateMDY();
  await fs.writeFile(
    path.join(__dirname, `../aggregation/history/${date}_${coin}.json`),
    JSON.stringify(history)
  );
}

async function getHistoryFromJsonFile(date, coin) {
  const data = await fs.readFile(
    path.join(__dirname, `../aggregation/history/${date}_${coin}.json`)
  );
  return JSON.parse(data);
}

async function fetchCoinHistory(coin) {
  const response = await axios.get(
    `https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=31`
  );
  return response.data;
}

async function fetchDailyCoinData(coin) {
  const response = await axios.get(
    `https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=1`
  );
  return response.data;
}

// ROUTERS

coinHistoryRouter.get("/daily/:coin", async (req, res) => {
  try {
    const coin = req.params.coin.toLowerCase();
    if (!coin) return res.status(400).json({ error: "Missing coin parameter" });

    const shortMatchedCoin = findMatchingCoin(coin);
    if (!shortMatchedCoin)
      return res.status(400).json({ error: "Invalid coin parameter" });

    const date = getThisDateMDY();
    if (!(await isJsonHistoryFileExist(date, shortMatchedCoin))) {
      const dailyHistory = await fetchDailyCoinData(shortMatchedCoin);
      await saveHistoryInJsonFile(dailyHistory, shortMatchedCoin);
      return res
        .status(200)
        .json({ coin: shortMatchedCoin, prices: dailyHistory.prices });
    }

    const history = await getHistoryFromJsonFile(date, shortMatchedCoin);
    return res
      .status(200)
      .json({ coin: shortMatchedCoin, prices: history.prices });
  } catch (error) {
    error.message && console.error(error.message);
    return res.status(500).json({ error: "Something went wrong on server" });
  }
});

coinHistoryRouter.get("/weekly/:coin", async (req, res) => {
  try {
    const coin = req.params.coin.toLowerCase();
    if (!coin) return res.status(400).json({ error: "Missing coin parameter" });

    const shortMatchedCoin = findMatchingCoin(coin);
    if (!shortMatchedCoin)
      return res.status(400).json({ error: "Invalid coin parameter" });

    // Check if cached data exists and is still valid
    if (
      !weeklyCache[shortMatchedCoin] ||
      Date.now() - weeklyCache[shortMatchedCoin].timestamp > cacheExpiration
    ) {
      const history = await fetchCoinHistory(shortMatchedCoin);
      weeklyCache[shortMatchedCoin] = { data: history, timestamp: Date.now() };
    }

    return res.status(200).json({
      coin: shortMatchedCoin,
      prices: weeklyCache[shortMatchedCoin].data.prices,
    });
  } catch (error) {
    error.message && console.error(error.message);
    return res.status(500).json({ error: "Something went wrong on server" });
  }
});

coinHistoryRouter.get("/monthly/:coin", async (req, res) => {
  try {
    const coin = req.params.coin.toLowerCase();
    if (!coin) return res.status(400).json({ error: "Missing coin parameter" });

    const shortMatchedCoin = findMatchingCoin(coin);
    if (!shortMatchedCoin)
      return res.status(400).json({ error: "Invalid coin parameter" });

    // Check if cached data exists and is still valid
    if (
      !monthlyCache[shortMatchedCoin] ||
      Date.now() - monthlyCache[shortMatchedCoin].timestamp > cacheExpiration
    ) {
      const history = await fetchCoinHistory(shortMatchedCoin);
      monthlyCache[shortMatchedCoin] = { data: history, timestamp: Date.now() };
    }

    return res.status(200).json({
      coin: shortMatchedCoin,
      prices: monthlyCache[shortMatchedCoin].data.prices,
    });
  } catch (error) {
    error.message && console.error(error.message);
    return res.status(500).json({ error: "Something went wrong on server" });
  }
});

const popularCoins = [
  "bitcoin",
  "ethereum",
  "ripple",
  "tether",
  "usd-coin",
  "binance-usd",
  "cardano",
  "polkadot",
  "dogecoin",
  "shiba-inu",
  "litecoin",
  "solana",
  "polo-gold",
];

async function initDailyPopularCoins() {
  for (const coin of popularCoins) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log("Fetching daily data for popular coin: ", coin);
    const shortMatchedCoin = findMatchingCoin(coin);
    if (!shortMatchedCoin) continue;
    if (!(await isJsonHistoryFileExist(getThisDateMDY(), shortMatchedCoin))) {
      const dailyHistory = await fetchDailyCoinData(shortMatchedCoin);
      await saveHistoryInJsonFile(dailyHistory, shortMatchedCoin);
    }
  }
}

// Helper function to check if the current day has changed
function isNewDay() {
  const today = new Date().setHours(0, 0, 0, 0);
  return today !== lastCheckDate;
}

// Schedule a daily task to initialize popular coins
let lastCheckDate = new Date().setHours(0, 0, 0, 0);
async function scheduleDailyTask() {
  while (true) {
    if (isNewDay()) {
      lastCheckDate = new Date().setHours(0, 0, 0, 0);
      await initDailyPopularCoins();
    }
    await new Promise((resolve) => setTimeout(resolve, 3600000)); // Check every hour
  }
}

// Initialize daily popular coins on server start
initDailyPopularCoins()
  .then(() => {
    console.log("Daily popular coins initialized successfully");
    scheduleDailyTask();
  })
  .catch(
    (err) =>
      err.message &&
      console.error("Error initializing daily popular coins:", err.message)
  );

console.log("Coin history router loaded");
module.exports = coinHistoryRouter;
