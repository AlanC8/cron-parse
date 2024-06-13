const axios = require("axios");
require('dotenv').config();
const cheerio = require("cheerio");
const express = require("express");
const app = express();
const fs = require("fs").promises;

const cron = require('node-cron');

cron.schedule('* * * * *', fetchAndSaveProducts);


async function fetchData(url) {
  const { data } = await axios.get(url);
  return cheerio.load(data);
}

async function parseProduct(url) {
  const $ = await fetchData(url);

  const products = [];

  $(".x-product-card__card").each((index, element) => {
    const title = $(element)
      .find(".x-product-card-description__product-name")
      .text()
      .trim();
    const link = $(element).find("a").attr("href");
    let price = $(element)
      .find(".x-product-card-description__price-single")
      .text()
      .trim();

    // Проверка на скидку
    if (!price) {
      price = $(element)
        .find(".x-product-card-description__price-old")
        .text()
        .trim();
    }

    products.push({
      title,
      price,
      link: `https://www.lamoda.kz${link}`,
    });
  });

  return products;
}

async function saveProductsToFile(products, filename) {
  const data = JSON.stringify(products, null, 2);
  await fs.writeFile(filename, data, "utf8");
  console.log(`Data saved to ${filename}`);
}

const url = "https://www.lamoda.kz/b/2047/brand-nike/";
parseProduct(url)
  .then((products) => {
    return saveProductsToFile(products, "products.json");
  })
  .catch((error) => {
    console.error(error);
  });

async function fetchAndSaveProducts() {
  const url = "https://www.lamoda.kz/b/2047/brand-nike/";
  try {
    const products = await parseProduct(url);
    await saveProductsToFile(products, "products.json");
} catch (error) {
    console.error(error);
  }
}
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});