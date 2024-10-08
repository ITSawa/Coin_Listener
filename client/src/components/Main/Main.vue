<template>
  <main>
    <CoinLoader @find-coin="findCoin" />
    <CoinList
      :coins="coins"
      @set-selected-coin="setSelectedCoin"
      @delete-coin="deleteCoin"
    />
    <template v-if="selected_coin">
      <MainGraphics :selected_coin="selected_coin" />
    </template>
  </main>
</template>

<script>
import { accessed_coins_symbols, accessed_coins_names } from "../coins";
import CoinLoader from "./components/CoinLoader.vue";
import CoinList from "./components/CoinList.vue";
import MainGraphics from "./components/MainGraphics.vue";

export default {
  name: "MainPage",
  components: {
    CoinLoader,
    CoinList,
    MainGraphics,
  },
  data() {
    return {
      selected_coin: null,
      coins: [],
      accessed_coins_symbols,
      accessed_coins_names,
    };
  },
  async created() {
    this.loadCoins();
    await this.updatePrice();
    this.cycleOfUpdatePrice();
  },
  methods: {
    findCoin(coin) {
      if (!coin) {
        console.log("Please enter a coin name or symbol.");
        return;
      }

      const lowerCaseCoin = coin.toLowerCase();
      if (
        this.coins.some(
          (c) =>
            c.symbol.toLowerCase() === lowerCaseCoin ||
            c.name.toLowerCase().includes(lowerCaseCoin)
        )
      ) {
        console.log("Coin already added.");
        return;
      }

      const symbol = this.accessed_coins_symbols.find(
        (symbol) => symbol.toLowerCase() === lowerCaseCoin
      );
      const name = Object.keys(this.accessed_coins_names).find((name) =>
        name.toLowerCase().includes(lowerCaseCoin)
      );

      if (symbol) {
        const coinName = Object.keys(this.accessed_coins_names).find(
          (name) => this.accessed_coins_names[name] === symbol
        );
        this.coins = [
          ...this.coins,
          { symbol: symbol, name: coinName || symbol },
        ];
        console.log("Coin found: " + symbol);
      } else if (name) {
        const coinSymbol = this.accessed_coins_names[name];
        this.coins = [...this.coins, { symbol: coinSymbol, name: name }];
        console.log("Coin found: " + coinSymbol);
      } else {
        console.log("Coin not found");
      }

      this.saveCoins();
      console.log(this.coins);
    },
    setSelectedCoin(coinData) {
      this.selected_coin = { ...coinData };
      console.log("Selected coin is ", this.selected_coin.name);
    },
    deleteCoin(index) {
      const deletedCoin = this.coins[index];
      this.coins = this.coins.filter((_, i) => i !== index);
      if (
        this.selected_coin &&
        this.selected_coin.symbol === deletedCoin.symbol
      ) {
        this.selected_coin = null;
      }
      this.saveCoins();
      console.log("Coin deleted", this.coins);
    },
    saveCoins() {
      localStorage.setItem("coins", JSON.stringify(this.coins));
    },
    loadCoins() {
      const savedCoins = localStorage.getItem("coins");
      if (savedCoins) {
        this.coins = JSON.parse(savedCoins);
      }
    },
    async getCoinPriceRequest(coin) {
      const response = await fetch(`backend/api/coin/${coin}`);
      const data = await response.json();
      console.log(data);
      return data;
    },
    async updatePrice() {
      if (localStorage.getItem("coinsUpdatedDate") < Date.now() - 1000 * 10) {
        const updatedCoins = await Promise.all(
          this.coins.map(async (coin) => {
            const data = await this.getCoinPriceRequest(coin.symbol);
            return { ...coin, price: this.fixToAnyPrice(data.price) };
          })
        );
        this.coins = updatedCoins;
        if (this.selected_coin) {
          const selectedCoin = this.coins.find(
            (coin) => coin.symbol === this.selected_coin.symbol
          );
          if (selectedCoin) {
            this.selected_coin = { ...selectedCoin };
          }
        }

        localStorage.setItem("coinsUpdatedDate", Date.now());
        this.saveCoins();
      }
    },
    cycleOfUpdatePrice() {
      setInterval(async () => {
        await this.updatePrice();
        this.saveCoins();
      }, 15000); // 15 seconds
    },
    fixToAnyPrice(price) {
      const numPrice = Number(price);

      // if (numPrice < 0.02) {
      //   return numPrice.toFixed(8).replace(/\.?0+$/, "");
      // } else {
      //   return numPrice.toFixed(2).replace(/\.?0+$/, "");
      // }
      return numPrice.toFixed(8).replace(/\.?0+$/, "");
    },
  },
};
</script>

<style scoped>
main {
  height: 100%;
  min-height: 100vh;
}
</style>
