<template>
  <div class="graphic_coin_now container">
    <h3 class="main-color" v-show="priceRatios.length === 0">
      Price is not uploaded, wait for it...
    </h3>
    <ul>
      <li
        v-for="(height, index) in scaledPriceRatios"
        :key="index"
        :style="{ height: height + 'px', width: '4%' }"
        @mouseenter="showPrice(index)"
        @mouseleave="hidePrice"
      >
        <span class="price-tooltip" v-if="hoveredIndex === index">
          {{ priceRatios[index] }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "CurrentPriceGraph",
  props: {
    currentPrice: {
      type: Number,
      required: true,
    },
    priceRatios: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      hoveredIndex: null,
    };
  },
  computed: {
    scaledPriceRatios() {
      const maxPrice = Math.max(...this.priceRatios);
      const minPrice = Math.min(...this.priceRatios);
      console.log(this.priceRatios);
      return this.priceRatios.map((price) => {
        const scaledHeight = ((price - minPrice) / (maxPrice - minPrice)) * 340;
        return Math.max(10, scaledHeight);
      });
    },
  },
  methods: {
    showPrice(index) {
      this.hoveredIndex = index;
    },
    hidePrice() {
      this.hoveredIndex = null;
    },
  },
};
</script>
