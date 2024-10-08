<template>
  <div v-if="selected_coin" class="coin_graphics container">
    <hr />
    <h2>
      Selected Coin:
      <span class="main-color">{{ selected_coin.name }}</span>
      current price:
      <span class="main-color">{{ selected_coin.price }} USD</span>
    </h2>
    <h3>Current price variance</h3>
    <CurrentPriceGraph
      :current-price="selected_coin.price"
      :price-ratios="arrCurrentPriceRatio"
    />
    <h3>Daily price variance</h3>
    <HistoricalPriceGraph :selected_coin="selected_coin" />
  </div>
</template>

<script>
import CurrentPriceGraph from "./CurrentPriceGraph.vue";
import HistoricalPriceGraph from "./HistoricalPriceGraph.vue";

export default {
  name: "MainGraphics",
  components: {
    CurrentPriceGraph,
    HistoricalPriceGraph,
  },
  props: {
    selected_coin: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      arrCurrentPriceRatio: [],
      intervalId: null,
    };
  },
  watch: {
    selected_coin: {
      handler(newVal, oldVal) {
        if (newVal.name !== oldVal.name) {
          this.resetPriceRatio();
          this.updateCurrentPriceRatio();
        }
      },
      immediate: true,
    },
  },
  methods: {
    resetPriceRatio() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
      this.arrCurrentPriceRatio = [this.selected_coin.price];
    },
    updateCurrentPriceRatio() {
      this.intervalId = setInterval(() => {
        this.arrCurrentPriceRatio.push(this.selected_coin.price);
        if (this.arrCurrentPriceRatio.length > 50) {
          this.arrCurrentPriceRatio.shift();
        }
      }, 5000);
    },
  },
  mounted() {
    if (this.selected_coin) {
      this.updateCurrentPriceRatio();
    }
  },
  beforeUnmount() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  },
};
</script>

<style lang="scss" scoped></style>
