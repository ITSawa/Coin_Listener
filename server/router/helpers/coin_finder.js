const { shortCoinNames, accessedCoinsNames } = require("./accessed_coins");

if (!shortCoinNames || !accessedCoinsNames) {
  throw new Error("Coin names not found");
}

function findMatchingCoin(coin) {
  const lowerCaseCoin = coin.toLowerCase();
  const matchedCoin = Object.keys(accessedCoinsNames).find((key) =>
    key.toLowerCase().includes(lowerCaseCoin)
  );
  return matchedCoin || shortCoinNames[lowerCaseCoin];
}

console.log("Coin finder loaded");
module.exports = { findMatchingCoin };
