<template>
  <div class="graphic_coin_timeline container">
    <h3 class="main-color" v-show="coinHistory.length === 0 && !errorLoading">
      History not uploaded, wait for it...
    </h3>
    <h3 class="main-color" v-show="errorLoading">Error while loading data</h3>
    <canvas v-if="coinHistory.length > 0" ref="coinCanvas"></canvas>
    <div
      v-if="hoverData && coinHistory.length > 0"
      class="tooltip"
      :style="{ top: hoverData.y + 'px', left: hoverData.x + 'px' }"
    >
      <p>Date: {{ hoverData.date.toLocaleString() }}</p>
      <p>Price: USD {{ String(hoverData.price).replace(/0+$/, "") }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "HistoricalPriceGraph",
  data() {
    return {
      coinHistory: [],
      hoverData: null,
      errorLoading: false,
    };
  },
  props: {
    selected_coin: {
      type: Object,
      required: true,
    },
  },
  async mounted() {
    await this.fetchCoinHistory();
    this.drawGraph();
    window.addEventListener("resize", this.drawGraph);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.drawGraph);
    const canvas = this.$refs.coinCanvas;
    if (canvas) {
      canvas.removeEventListener("mousemove", this.handleMouseMove);
    }
  },
  watch: {
    selected_coin: {
      async handler() {
        this.errorLoading = false;
        await this.fetchCoinHistory();
        this.drawGraph();
      },
      deep: true,
    },
  },
  methods: {
    async fetchCoinHistory() {
      const savedHistoryKey = `history_${this.selected_coin.name}`;
      const savedHistory = localStorage.getItem(savedHistoryKey);

      const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = ("0" + (d.getMonth() + 1)).slice(-2);
        const day = ("0" + d.getDate()).slice(-2);
        return `${year}-${month}-${day}`;
      };

      const currentDate = formatDate(new Date());

      if (
        !savedHistory ||
        formatDate(JSON.parse(savedHistory).time) !== currentDate
      ) {
        try {
          const response = await fetch(
            `/backend/api/daily/${this.selected_coin.name.toLowerCase()}`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch coin history");
          }

          const data = await response.json();
          this.coinHistory = data.prices.map((item) => ({
            date: new Date(item[0]),
            price: item[1],
          }));
          localStorage.setItem(
            savedHistoryKey,
            JSON.stringify({ history: this.coinHistory, time: Date.now() })
          );
          console.log("Coin history updated");
          this.errorLoading = false;
        } catch (error) {
          this.coinHistory = [];
          this.errorLoading = true;
          console.error(error.message);
        }
      } else {
        const savedData = JSON.parse(savedHistory);
        this.coinHistory = savedData.history.map((item) => ({
          date: new Date(item.date),
          price: item.price,
        }));
        console.log("Coin history loaded from local storage");
        this.errorLoading = false;
      }
    },
    drawGraph() {
      const canvas = this.$refs.coinCanvas;
      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext("2d");

      canvas.width = canvas.clientWidth;
      canvas.height = 400;

      const width = canvas.width;
      const height = canvas.height;
      const padding = 50;

      const prices = this.coinHistory.map((item) => item.price);

      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);

      const yScale = (height - 2 * padding) / (maxPrice - minPrice);
      const xScale = (width - 2 * padding) / (prices.length - 1);

      ctx.clearRect(0, 0, width, height);

      ctx.beginPath();
      ctx.moveTo(padding, height - padding - (prices[0] - minPrice) * yScale);
      prices.forEach((price, index) => {
        const x = padding + index * xScale;
        const y = height - padding - (price - minPrice) * yScale;
        ctx.lineTo(x, y);
      });
      ctx.strokeStyle = "#6756ff";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.strokeStyle = "#000";
      ctx.stroke();

      ctx.fillStyle = "#000";
      ctx.font = "12px Arial";
      ctx.textAlign = "right";
      ctx.fillText(maxPrice.toFixed(2), padding - 10, padding);
      ctx.fillText(minPrice.toFixed(2), padding - 10, height - padding);

      ctx.textAlign = "center";
      const numLabels = 10;
      for (let i = 0; i <= numLabels; i++) {
        const index = Math.floor(
          (i / numLabels) * (this.coinHistory.length - 1)
        );
        const date = this.coinHistory[index].date;
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()} ${date
          .getHours()
          .toString()
          .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
        const x = padding + index * xScale;
        ctx.fillText(formattedDate, x, height - padding + 20);
      }

      canvas.addEventListener("mousemove", this.handleMouseMove);
    },
    handleMouseMove(event) {
      const canvas = this.$refs.coinCanvas;
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;

      const width = canvas.width;
      const height = canvas.height;
      const padding = 50;

      const prices = this.coinHistory.map((item) => item.price);
      const dates = this.coinHistory.map((item) => item.date);

      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);

      const yScale = (height - 2 * padding) / (maxPrice - minPrice);
      const xScale = (width - 2 * padding) / (prices.length - 1);

      const hoverIndex = Math.floor((mouseX - padding) / xScale);
      if (hoverIndex >= 0 && hoverIndex < this.coinHistory.length) {
        const hoverDate = dates[hoverIndex];
        const hoverPrice = prices[hoverIndex];
        const hoverX = padding + hoverIndex * xScale;
        const hoverY = height - padding - (hoverPrice - minPrice) * yScale;

        this.hoverData = {
          date: hoverDate,
          price: hoverPrice,
          x: Math.min(Math.max(hoverX, padding), width - padding),
          y: Math.min(Math.max(hoverY, padding), height - padding),
        };
      } else {
        this.hoverData = null;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.graphic_coin_timeline {
  position: relative;
  padding: 0;

  h3 {
    margin: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  canvas {
    width: 100%;
    height: 400px;
    margin: 0;
  }

  .tooltip {
    position: absolute;
    background: rgba(10, 6, 22, 0.7);
    color: #fff;
    padding: 10px;
    border-radius: 5px;
    pointer-events: none;
    transform: translate(-50%, -100%);
    white-space: nowrap;
  }
}
</style>
