
import fetch from 'node-fetch';

import { 
  toCapitalizeCase,
  handlerTextParser,
  handlerGetAttrib,
  handlerGetHtml,
  handlerGetText,
  handlerGetArticleItem,
  handlerGetSectionItem,
  handlerGetAllLatest,
  handlerParseFilters,
  handlerCheckTotalPages, 
  handlerGetTotalPages,
  handlerAreFilters } from './utils.js';

import {
  Routes, AnimeInfo, 
  TioanimeError, ErrorTypes, 
  AnimeLinks, AnimeReleated,
  ArticleItem, AnimeSearch,
  SectionItem,
  AnimeLatestOptions, 
  AnimeAllLatest,
  Filters, FiltersResult,
  AnimeProgramming, 
  AnimeProgrammingItem,
  ObjectDef } from './types';

import {JSDOM} from 'jsdom';

class Tioanime_scraper {

  static domain: string = 'https://tioanime.com';

  static error: ErrorTypes = {
    '404': {
      message: "[ERROR] Not Found."
    },
    'Internal Exception': {
      message: "[ERROR] An internal exception ocurred. Report it to the developer."
    },
    'Page Error': {
      message: "[ERROR] 'page' parameter passed greater than total pages."
    },
    'Parameter Error': {
      message: "[ERROR] 'article_name' is not valid keys: 'chapters' | 'animes' | 'movies' | 'ovas' | 'specials' | '*' " 
    },
    'Default Error':{
      message: "[ERROR]: default error message."
    },
    'No Items': {
      message: "[ERROR] No items found."
    },
    'No Filters': {
      message: "[ERROR] filters"
    }
  }

  static routes: Routes = {
    search: '/directorio?q=', // has query parameters ?q
    anime: '/anime/', // has parameters :anime-name
    watch: '/ver/', // has parameters :anime-name
    programming: '/programacion'
  }

  /** 
    * @param {[string]} url url of query.
    * @returns 
    * html jsdom document.
    * html cheerio document.
    */
  static async getDocument(url:string): Promise<JSDOM> {
    const res = await fetch(url);
    const body = await res.text(); // html
    const doc = new JSDOM(body);
    return doc;
  }

  /**
    * @param {[string]} id anime id.
    * @returns 
    * general information about anime as AnimeInfo Object, 
    * or Error Object.
    */
  static async getAnimeInfo(id:string): Promise<AnimeInfo | TioanimeError> {

    const this_ = Tioanime_scraper;

    try{

      // IMPORTANT REFERENCES: 
      // handlerTextParser, handlerGetAttrib, 
      // handlerGetHtml, handlerGetText handlers functions.

      var 
        chapters: number = 0,
        anime_id: string = id, 
        genres: string[] = [],
        releated: AnimeReleated[] = [] 
      ;

      const url: string = `${this_.domain}${this_.routes.anime}${id}`;
      // create url.

      const _: JSDOM = await this_.getDocument(url);

      const doc: Document =  _.window.document;

      const titleNode: Element | null = doc.querySelector('.title');
      // node to check if there is an error. 

      if( (titleNode === null) || 
        (titleNode.innerHTML === 'Ups... Prueba de nuevo')){
        return this_.error['404'];
      }
      // checks that it did not return 404 page.

      const scripts: NodeListOf<Element> = doc.querySelectorAll('script');
      
      const ep_no_parsed: string = scripts.item(scripts.length-1).innerHTML;
      // last script tag html (javascript code as string).

      const match: RegExpMatchArray | null = ep_no_parsed.match(/episodes =/); 

      if( (match !== null) && (match.index !== undefined) ){
        const list_start = ep_no_parsed.slice(match.index+11);
        const arr_chapters: string = JSON.parse(
          list_start.slice(0, list_start.indexOf(';'))
        );
        chapters = parseInt(arr_chapters[0]);
      }
      // get array of chapters and take first.

      const mId_no_parsed: string = scripts.item(scripts.length-2).innerHTML;

      const mal_link: string =  mId_no_parsed.slice(
        mId_no_parsed.indexOf("'")+1,
        mId_no_parsed.indexOf(')')-1
      );
      // get api jikan link from penultimate link.

      // In a nutshell, you are getting important labels 
      // and then finding their values.
      const poster: string = `${this_.domain}${handlerGetAttrib( doc.querySelector('.thumb figure img'), 'src' )}`

      const p_synopsis: Element | null = doc.querySelector('.sinopsis');

      const season_html: string = handlerGetHtml( doc.querySelector('.season .season span') );
      // .season > .season > span

      const genres__span__a: NodeListOf<Element> = doc.querySelectorAll('.genres span a');
      // genres > span > a

      const article_anime: NodeListOf<Element> = doc.querySelectorAll('.sm');
      // 

      genres__span__a.forEach( genre => {
        genres.push(genre.innerHTML);
      });
      // gets genre as string, from each genre tag.

      article_anime.forEach( article => {

        const href = handlerGetAttrib( article.querySelector('.thumb a'), 'href' );
        const image = `${this_.domain}${handlerGetAttrib( article.querySelector('img'), 'src' )}`;

        const releated_anime: AnimeReleated = {
          name: handlerGetHtml( article.querySelector('.media-body h3') ),
          id: href.slice(7), // obtains only id from href.
          image,
          type: handlerGetHtml( article.querySelector('.anime-type-peli') ),
          year: handlerGetHtml( article.querySelector('.year') )
        }

        releated.push(releated_anime);

      });
      // for each article.sm tag ( releated animes container )
      // get whatever values ​​there are.

      const anime_info: AnimeInfo = {
        name: handlerGetText( doc.querySelector('.title') ), 

        anime_id,

        malId: mal_link.slice(mal_link.indexOf('anime/')+6),

        poster,

        banner: poster.replace('portadas', 'fondos'),

        episodePoster: poster.replace('portadas', 'thumbs'),

        genres,

        synopsis: handlerTextParser( handlerGetText(p_synopsis) ),  

        chapters,

        type: handlerGetHtml( doc.querySelector('.anime-type-peli') ),

        year: handlerGetHtml( doc.querySelector('.year') ),

        status: handlerGetText( doc.querySelector('.status') ),

        season: handlerTextParser(season_html).split('  ')[0], 

        releated
      }
      // i tried to simplified code with handler, which in short, 
      // gets attribs or text content without you
      // having to check if it's null.

      return anime_info;

    } catch(error) {

      return this_.error['Internal Exception'];
      
    }

  }

  /**
    * @param {[string]} id anime id. 
    * @param {[number]} chapter anime chapter number.
    * @returns 
    * object with anime download_links and watch_links. 
    * if anything are wrong returns error object.
    */
  static async getAnimeChapter(id:string, chapter:number): Promise<AnimeLinks | TioanimeError> {

    var 
      links: ObjectDef = {},
      download_links: ObjectDef = {};

    const this_ = Tioanime_scraper;

    const url: string = `${this_.domain}${this_.routes.watch}${id + '-' + chapter}`;
    // example: { https://tioanime.com }{ /ver/ }{ naruto-1 }

    const _: JSDOM = await this_.getDocument(url);

    const doc: Document = _.window.document;
    // javascript Document.

    const titleNode: Element | null = doc.querySelector('.title');

    if( (titleNode === null) || 
      (titleNode.innerHTML === 'Ups... Prueba de nuevo')){
      return this_.error['404'];
    }
    // checks that it did not return 404 page.


    // get to watch links ----------------
    const scripts = doc.querySelectorAll('script');
    const content: string = scripts.item(scripts.length-1).innerHTML;

    const parse: string[][] = JSON.parse(
      content.slice(
        content.indexOf('[['),
        content.indexOf(']]') + 2
      )
    );
    // get links array from script tag number 16 text.
    // and parse to json.

    parse.forEach(item => {
      const server_keys: string[] = Object.keys(links);
      const server_name: string = item[0].toLowerCase();
      const server_link: string = item[1];
      // get server name and server link from parsed links array.

      if (!server_keys.includes(server_name)) {
        links[server_name] = [];
      }
      // if not this iteration 'links' keys includes
      // server name , then add to it.

      links[server_name].push(server_link);
      // finally push value. (link)
      
    });
    // get to watch links ---------------- ends


    // get download links ----------------
    doc.querySelectorAll('tbody tr').forEach( tr => {

      var 
        server_keys: string[],
        href: string = '',
        server_name: string,
        td_tags: NodeListOf<HTMLTableCellElement>,
        td__a: Element | null;

      server_keys = Object.keys(download_links);
      // save iteration keys of download_links.

      td_tags = tr.querySelectorAll('td');
      // get all td from tr tag.

      server_name = td_tags.item(0).innerHTML;
      // get server name from innerHTML td tag index 0.

      td__a = tr.querySelector('td a');
      // get link from child of td.
      
      if(td__a !== null){
        href = td__a.getAttribute('href') || '';
      }
      // if a not equals to null then get attribute or ''.

      if( !server_keys.includes(server_name) ) {
        download_links[server_name] = [];
      }
      // if not this iteration download_links keys includes
      // server name , then add to it.

      download_links[server_name].push(href);
      // finally push elements.

    });
    // get download links ---------------- ends
    
    return {
      id, chapter,
      links: {
        watch_links: links,
        download_links: download_links
      }
    }

  }

  /** 
   * @param {[string]} query query should be anime name.
   * @param {[number]} page page to search, recommend set it to 1.
   * @returns object AnimeSearch type object, with next properties:
   * @page that you passed, 
   * @total_pages total of pages that query found,
   * @anime_results results of query as AnimeArticle object.
   */
  static async getByQuery(query:string, page:number=1): Promise<AnimeSearch | TioanimeError> {

    const this_ = Tioanime_scraper;

    page = page<1? 1: page;
    // default value.

    var url = `${this_.domain}${this_.routes.search}${query}&p=${page}`;

    const _ = await this_.getDocument(url);

    const doc = _.window.document;

    const items: ArticleItem [] = handlerGetArticleItem(doc, '.anime');

    if( items.length === 0 ){
      return this_.error['No Items'];
    }

    const total_pages: number = handlerGetTotalPages(doc);

    const totalPagesError = handlerCheckTotalPages(doc, page);

    if( totalPagesError !== 'ok' ) {
      return { 
        ...this_.error['Page Error'], 
        info: `total pages: ${total_pages}`, // if total_pages is 0, returns message 'no items found.'
        query: `query: ${query}`
      }
    }
    // if 'page' value passed greater than total pages
    // returns error.

    const result: AnimeSearch = { query, anime_results: items, page, total_pages }

    return result;

  }
  
  /**
   * @param article_name should have as value next strings: 'chapters' | 'animes' | 'movies' | 'ovas' | 'specials' | '*'
   * @returns Array with latest article requested, or Object with all latest elements.
   */
  static async getLatest( article_name: string ): 
    Promise<ArticleItem[] | SectionItem[] | 
    AnimeAllLatest | TioanimeError> {

    const this_ = Tioanime_scraper;
    
    const options: AnimeLatestOptions = {
      'chapters': () => handlerGetArticleItem(doc, '.episode'),
      'animes': () => handlerGetArticleItem(doc, '.anime'),
      'movies': () => handlerGetSectionItem(doc, 'movies'),
      'ovas': () => handlerGetSectionItem(doc, 'ovas'),
      'specials': () => handlerGetSectionItem(doc, 'onas'),
      '*': () => handlerGetAllLatest(options)
    }
    const url: string = this_.domain;
    const _: JSDOM = await this_.getDocument(url);
    const doc: Document = _.window.document;

    if(!(Object.keys(options).includes(article_name))) {
      return this_.error['Parameter Error'];
    }

    return options[article_name]();
  }

  /**
   * @param filters filters to get animes.
   * @return retuns array with animes that match the filters.
   */
  static async getAnimesFromFilters(filters:Filters): 
    Promise<FiltersResult | TioanimeError> {
    
    const this_ = Tioanime_scraper;

    const filters_error: string = handlerAreFilters(filters);
    // 'ok' || error message..
    if(filters_error !== 'ok'){
      return { message:filters_error };
    }

    const url: string = handlerParseFilters(filters);

    const _: JSDOM = await this_.getDocument(url);

    const doc: Document = _.window.document;

    const items: ArticleItem[] = handlerGetArticleItem(doc, '.anime');

    const total_pages = handlerGetTotalPages(doc);

    const page: number = (
      filters.page!==undefined? 
        filters.page<1? 1:filters.page : 1
    );
    // if page is undefined or page less than one, set 1.

    const totalPagesError = handlerCheckTotalPages(doc, page, {
      message: `[ERROR] "page" is greater than total pages: ${total_pages}`
    });

    if( totalPagesError !== 'ok' ) {
      return totalPagesError;
    }

    const results: FiltersResult = {
      url, page, 
      total_pages, 
      results:items
    }

    return results;

  }

  /**
   * @description Get anime programming.
   * @returns AnimeProgramming type object, with animes of each day.
   */
  static async getAnimeProgramming(): Promise<AnimeProgramming | TioanimeError> {

    const this_ = Tioanime_scraper;

    const days: AnimeProgramming = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    }
    // define days object to indexer later.

    const url: string = `${this_.domain}${this_.routes.programming}`;

    const _: JSDOM = await this_.getDocument(url);

    const doc: Document = _.window.document;

    let key: keyof AnimeProgramming;

    for( key in days ) {
    
      const day: keyof AnimeProgramming = toCapitalizeCase(key) as any;
      // parse day to be able to use as id after..
      
      const day__a: NodeListOf<Element> = doc.querySelectorAll(`#${day} a`);

      day__a.forEach( tag => {
        
        // see handlers for understand.

        const title: string = handlerGetHtml(tag.querySelector('h3'));
        const chapter: string = handlerTextParser(
          handlerGetHtml(tag.querySelectorAll('span')[1])
        );
        const status = handlerGetHtml(tag.querySelectorAll('span')[0]);
        const image = handlerGetAttrib(tag.querySelector('img'), 'src');

        const item: AnimeProgrammingItem = {
          name: title, 
          id:'...', 
          image: this_.domain+image,
          chapter, 
          status
        }
        
        days[key].push(item);

      });

    }
    // for each day get items.

    return days;

  }

}

export default Tioanime_scraper;

export {
  Routes, AnimeInfo, 
  TioanimeError, ErrorTypes, 
  AnimeLinks, AnimeReleated,
  ArticleItem, AnimeSearch,
  SectionItem,
  AnimeLatestOptions, 
  AnimeAllLatest,
  Filters, FiltersResult,
  AnimeProgramming, 
  AnimeProgrammingItem,
  ObjectDef 
}
