<template>
  <div v-if="coins.length > 0" class="coins_list_shower container">
    <hr />
    <ul class="row cards_container">
      <CoinItem
        v-for="(coinData, index) in paginatedCoins"
        :key="index"
        :coinData="coinData"
        @set-selected-coin="setSelectedCoin"
        @delete-coin="deleteCoin(index)"
      />
    </ul>
    <button @click="prevPage" class="btn" v-show="currentPage > 1">
      Previous
    </button>
    <button @click="nextPage" class="btn" v-show="currentPage < totalPages">
      Next
    </button>
  </div>
</template>

<script>
import CoinItem from "./CoinItem.vue";

export default {
  name: "CoinList",
  components: {
    CoinItem,
  },
  props: {
    coins: Array,
  },
  data() {
    return {
      currentPage: 1,
      itemPerPage: 6,
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.coins.length / this.itemPerPage);
    },
    paginatedCoins() {
      const start = (this.currentPage - 1) * this.itemPerPage;
      const end = start + this.itemPerPage;
      return this.coins.slice(start, end);
    },
  },
  methods: {
    setSelectedCoin(coinData) {
      this.$emit("set-selected-coin", coinData);
    },
    deleteCoin(index) {
      this.$emit(
        "delete-coin",
        (this.currentPage - 1) * this.itemPerPage + index
      );
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
  },
};
</script>
