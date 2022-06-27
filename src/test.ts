
import scraper from "./index.js";

async function test() {

  const items = await scraper.getByQuery('');

  console.log(items);

}

test();