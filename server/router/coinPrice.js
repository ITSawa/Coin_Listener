const express = require("express");
const axios = require("axios");
const { findMatchingCoin } = require("./helpers/coin_finder");
const { accessedCoinsNames } = require("./helpers/accessed_coins");

const coinCurrentPriceRouter = express.Router();

const coinCache = {};
const apiStatus = {
  Binance: { disabled: false, timestamp: null },
  CoinGecko: { disabled: false, timestamp: null },
  CryptoCompare: { disabled: false, timestamp: null },
  CoinCap: { disabled: false, timestamp: null },
};

const DISABLE_TIME = 20 * 60 * 1000; // 20 minutes in milliseconds

function setCoinInCache(coin, price) {
  coinCache[coin] = { coin: coin, price: price, time: Date.now() };
}

function getCoinFromCache(coin) {
  return coinCache[coin];
}

function isCacheExpired(coin) {
  return Date.now() - coinCache[coin].time > 15 * 1000; // 15 seconds
}

async function fetchCoinPrice(coin) {
  const apis = [
    {
      name: "Binance",
      url: `https://api.binance.com/api/v3/ticker/price?symbol=${accessedCoinsNames[
        coin
      ].toUpperCase()}USDT`,
    },
    {
      name: "CoinGecko",
      url: `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`,
    },
    {
      name: "CryptoCompare",
      url: `https://min-api.cryptocompare.com/data/price?fsym=${accessedCoinsNames[
        coin
      ].toUpperCase()}&tsyms=USD`,
    },
    { name: "CoinCap", url: `https://api.coincap.io/v2/assets/${coin}` },
  ];

  for (const api of apis) {
    // Check if the API is disabled
    if (apiStatus[api.name].disabled) {
      const timeElapsed = Date.now() - apiStatus[api.name].timestamp;
      if (timeElapsed < DISABLE_TIME) {
        // console.log(`${api.name} is temporarily disabled.`);
        continue; // Skip to the next API if it's disabled
      } else {
        // Re-enable the API if 30 minutes have passed
        apiStatus[api.name].disabled = false;
        apiStatus[api.name].timestamp = null;
      }
    }

    // Try to fetch data from the API
    try {
      const response = await axios.get(api.url);
      console.log(`Data from ${api.name}:`, response.data); // Debugging

      let price;
      if (api.name === "Binance") {
        price = response.data.price;
      } else if (api.name === "CoinGecko") {
        price = response.data[coin]?.usd;
      } else if (api.name === "CryptoCompare") {
        price = response.data.USD;
      } else if (api.name === "CoinCap") {
        price = response.data.data.priceUsd;
      }

      if (price !== undefined) {
        return price; // Return price if successful
      }
    } catch (error) {
      console.error(`Error fetching from ${api.name}:`, error.message);
      // Disable the API for 30 minutes on error
      apiStatus[api.name].disabled = true;
      apiStatus[api.name].timestamp = Date.now();
    }
  }

  throw new Error("Unable to fetch coin price from available APIs");
}

coinCurrentPriceRouter.get("/coin/:coin", async (req, res) => {
  try {
    const coin = req.params.coin.toLowerCase();
    if (!coin) {
      return res.status(400).json({ error: "Missing coin parameter" });
    }

    const shortMatchedCoin = findMatchingCoin(coin);

    if (!shortMatchedCoin) {
      return res.status(400).json({ error: "Invalid coin parameter" });
    }

    const cachedCoin = getCoinFromCache(shortMatchedCoin);
    if (cachedCoin && !isCacheExpired(shortMatchedCoin)) {
      return res
        .status(200)
        .json({ coin: shortMatchedCoin, price: cachedCoin.price });
    }

    const price = await fetchCoinPrice(shortMatchedCoin);
    setCoinInCache(shortMatchedCoin, price);

    return res.status(200).json({ coin: shortMatchedCoin, price: price });
  } catch (error) {
    error.message && console.error(error.message);
    return res.status(500).json({ error: "Something went wrong on server" });
  }
});

console.log("CoinCurrentPriceRouter loaded");
module.exports = coinCurrentPriceRouter;
