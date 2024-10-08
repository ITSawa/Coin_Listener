const express = require("express");
const dotenv = require("dotenv");
const coinCurrentPriceRouter = require("./router/coinPrice");
const coinHistoryRouter = require("./router/coinGraph");

dotenv.config({ path: "./.env", override: true });

const app = express();
const port = process.env.PORT || 3030;

app.use("/api", coinCurrentPriceRouter, coinHistoryRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
