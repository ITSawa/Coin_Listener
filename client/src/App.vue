<template>
  <body>
    <Header />
    <Main />
    <Footer />
  </body>
</template>

<script>
import Header from "./components/Header/Header.vue";
import Main from "./components/Main/Main.vue";
import Footer from "./components/Footer/Footer.vue";

export default {
  name: "App",
  components: {
    Header,
    Main,
    Footer,
  },
};
</script>

<style lang="scss">
@import "./assets/styles/index.scss";
@import "./assets/styles/header.scss";
@import "./assets/styles/main.scss";
@import "./assets/styles/main_graphics.scss";
</style>
