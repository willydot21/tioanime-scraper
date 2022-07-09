
import scraper from "./index.js";

async function test() {

  const items = await scraper.getAnimeInfo('steinsgate');

  console.log(items);

}

test();