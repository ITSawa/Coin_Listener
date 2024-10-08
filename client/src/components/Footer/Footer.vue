<template>
  <footer>
    <h1 class="main-color">Hello, anyone!</h1>
    <p>
      This is just a fun project. Check it out on
      <a :href="githubLink" target="_blank" rel="noopener noreferrer">GitHub</a
      >.
    </p>
  </footer>
</template>

<script>
export default {
  name: "FooterPage",
  data() {
    return {
      githubLink: "https://github.com/ITSawa",
    };
  },
};
</script>

<style scoped>
footer {
  text-align: center;
  padding: 1em;
  background-color: #f8f8fa;
  padding: 2rem;
}
a {
  color: #5900ff;
  font-weight: 600;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
</style>
