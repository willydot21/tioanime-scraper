
import scraper from "./index.js";
import { Filters } from "./types";

const test_req: Array<string> = [
  'naruto',
  'boku no hero',
  'one punch man'
];

const test_anime_info: Array<string> = [
  'great-teacher-onizuka',
  'steinsgate',
  'working'
]

const test_anime_chapter: Array<[string, number]> = [
  ['naruto', 1],
  ['steinsgate', 2],
  ['great-teacher-onizuka', 23]
]

const test_filters: Filters[] = [
  {
    genres: ['shounen', 'seinen'],
    types: ['tv'],
  },
  {
    genres: ['musica'],
    types: ['ova'],
    page: 2 // bad
  },
  {
    genres: ['shounen', 'ecchi'],
    types: ['ova'],
    page: 4
  },
]

async function test() {
  
  const 
    test1: Array<any> = [], 
    test2: Array<any> = [], 
    test3: Array<any> = [],
    test4: Array<any> = [],
    allTests: Array<boolean> = [];

  for(const test of test_req){

    const items = await scraper.getByQuery(test);

    if( !(Object.keys(items).includes('message')) ){
      test1.push(items);
    } else {
      console.log(items);
    }

  };

  for(const test of test_anime_chapter){

    const [ id, chapter ] = test;

    const items = await scraper.getAnimeChapter(id, chapter);

    if(!(Object.keys(items).includes('message'))){
      test2.push(items);
    } else {
      console.log(items);
    }

  };

  for(const test of test_anime_info){

    const items = await scraper.getAnimeInfo(test);

    if(!(Object.keys(items).includes('message'))){
      test3.push(items);
    } else {
      console.log(items);
    }

  };

  for(const test of test_filters){
    const items = await scraper.getAnimesFromFilters(test);

    if(!(Object.keys(items).includes('message'))){
      test4.push(items);
    } else {
      console.log(items);
    }
  }

  [ test1, test2, test3, test4 ].forEach( test => {
    allTests.push(test.length === 3);
  })

  console.log(
    allTests
  ); 

}

test();