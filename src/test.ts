
import scraper from "./index.js";

async function test() {

  const items = await scraper.getAnimeChapter('steinsgate', 2);

  console.log(items);

}

//test();