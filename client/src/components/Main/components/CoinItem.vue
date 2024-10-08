<template>
  <li @click="setSelected" class="cards">
    <div>
      <h3 class="main-color">{{ coinData.symbol }}</h3>
      <h4>{{ coinData.name }}</h4>
      <hr />
      <h5>Current price:</h5>
      <p>{{ coinData.price }} USD</p>
      <button @click.stop="deleteCoin" class="btn">Delete</button>
    </div>
  </li>
</template>

<script>
export default {
  name: "CoinItem",
  props: {
    coinData: Object,
  },
  methods: {
    setSelected() {
      this.$emit("set-selected-coin", this.coinData);
    },
    deleteCoin() {
      this.$emit("delete-coin");
    },
  },
};
</script>
