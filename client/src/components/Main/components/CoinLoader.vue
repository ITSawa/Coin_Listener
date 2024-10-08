<template>
  <div class="coin_loader container row">
    <input v-model="coin" type="text" placeholder="Coin name or symbol" />
    <button @click="findCoin" class="btn">find</button>
  </div>
</template>

<script>
export default {
  name: "CoinLoader",
  data() {
    return {
      coin: "",
    };
  },
  methods: {
    findCoin() {
      this.$emit("find-coin", this.coin);
      this.coin = "";
    },
  },
};
</script>
