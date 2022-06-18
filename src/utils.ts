
import { 
  AnimeLatestOptions, 
  AnimeAllLatest, 
  Filters, ObjectDef, 
  ArticleItem, SectionItem, TioanimeError } from './types';

import scraper from './index.js';

// validators - parsers
const types_parser: ObjectDef = {
  'tv': 0,
  'movie': 1,
  'ova': 2,
  'special': 3
}

const status_parser: ObjectDef = {
  'finished': 2, 'broadcast': 1, 'coming-soon': 3
}

const genres = [
  'accion', 'artes-marciales', 'aventuras', 'carreras',
  'ciencia-ficcion', 'comedia', 'demencia', 'demonios',
  'deportes', 'drama', 'ecchi', 'escolares', 'espacial',
  'fantasia', 'harem', 'historico', 'infantil', 'josei',
  'juegos', 'magia', 'mecha', 'militar', 'misterio', 'musica',
  'parodia', 'policia', 'psicologico', 'recuentos-de-la-vida',
  'romance', 'samurai', 'seinen', 'shoujo', 'shounen', 'sobrenatural',
  'superpoderes', 'suspenso', 'terror', 'vampiros', 'yaoi', 'yuri'
];
// 

/**
 * 
 * @param arr Array 1.
 * @param arr2 Array 2.
 * @description Checks if are array equals.
 * @returns Boolean.
 */
function areArrayEquals(arr:Array<any>, arr2:Array<any>): boolean {

  arr = arr.sort();

  arr2 = arr2.sort();

  return arr.every((val, ind) => val === arr2[ind]);
}

/**
 * @param str String to capitalize first letter.
 * @description Make first letter upper case.
 * @returns Str capitalize case.
 */
function toCapitalizeCase(str:string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
  * @param {[string]} text text to parse
  * @description remove last space ands line break.
  * @return {[string]} text parsed
  */
function handlerTextParser(text: string): string {

  var result = text.split('\n').join(' ');

  result = result.trim();
  // if text variable has spaces at the beginning
  // or at the end, then remove it.

  return result;
}

/**
 * @param node node element to check if it's null and get value.
 * @param attrib node attribute name.
 * @returns attribute value as string.
 */
function handlerGetAttrib(node: Element | null , attrib: string): string {
  if((node !== null) && (node !== undefined)){
    return node.getAttribute(attrib) || '';
  }
  return ''
}

/**
 * @param node node element to check if it's null.
 * @returns node innerHTML value as string.
 */
function handlerGetHtml(node: Element | null): string {
  if((node !== null) && (node !== undefined)){
    return node.innerHTML;
  }
  return '';
}

/**
 * @param node node element to check if it's null.
 * @returns node textContent value as string.
 * @description verify that node and textContent are not null.
 */
function handlerGetText(node: Element | null): string {
  if((node !== null) && (node !== undefined)){
    const content = node.textContent;
    return content === null? '':content;
  }

  return '';
}

/**
 * @param {[Document]} doc Document element to get article items.
 * @param {[string]} article_class selector option: .anime | .chapter
 * @description Handler to get article item from '/directorio ?...args' route.
 * @returns Array of ArticleItems elements. ( see 'types' )
 */
function handlerGetArticleItem(doc: Document, article_class:string): ArticleItem[] {

  const items: ArticleItem[] = []; 

  const articles: NodeListOf<Element> = doc.querySelectorAll(article_class);

  articles.forEach( article => {
    if( article.classList.length === 1 ) {
      const href: string = handlerGetAttrib(article.querySelector('a'), 'href');
      const id: string = href.split('/')[2];
      const poster: string = handlerGetAttrib(article.querySelector('.thumb figure img'), 'src');
      const name: string = handlerGetHtml(article.querySelector('a h3'));
      items.push({
        name, id, poster: 'https://tioanime.com'+poster
      });
    }
  });
  // for each article gets id, poster and original name.

  return items;
}

/**
 * @param {[Document]} doc Document element to get article items.
 * @param {[string]} section_name selector option: .movie | .ova | .ona (specials)
 * @description Handler to get section item from '/directorio ?...args' route.
 * @returns Array of SectionItem elements. ( see 'types' )
 */
function handlerGetSectionItem(doc: Document, section_name:string): SectionItem[] {
  
  const items: SectionItem[] = [];
  const section__article = doc.querySelectorAll(`.${section_name} ul .anime`);

  section__article.forEach( article => {

    const a: Element | null = article.querySelector('.media-body a');
    const genres: string[] = [];
    const genres__span__a: NodeListOf<Element> = article.querySelectorAll('.media-body .genres span a');
    const dsc_to_parse = handlerGetHtml(article.querySelector('.media-body .description'));
    
    genres__span__a.forEach( genre => {
      genres.push( handlerGetHtml(genre) );
    } );

    items.push({
      name: handlerGetHtml(article.querySelector('.media-body a h3')),
      id: handlerGetAttrib(a, 'href').split('/')[2],
      type: handlerGetHtml(article.querySelector('.thumb span')),
      poster: 'https://tioanime.com' + handlerGetAttrib(article.querySelector('.thumb a figure img'),'src'),
      description: handlerTextParser(dsc_to_parse),
      genres,
    })

  });

  return items;

}

/**
 * @param {[AnimeLatestOptions]} options options defined in scraper:363.
 * @returns returns all latest elements, as 'AnimeAllLatest' type object.
 */
function handlerGetAllLatest(options:AnimeLatestOptions): AnimeAllLatest {

  const result: AnimeAllLatest = {
    animes:[],
    chapters:[],
    movies:[],
    specials:[],
    ovas:[]
  }

  let article_name: keyof AnimeAllLatest;
  // set keyof for indexer in it.

  for ( article_name in result ) {

    const article_elements = options[article_name]();

    result[article_name].push(...article_elements);

  }

  return result;
  // i think thas's not need too much comments :'(
}

/**
 * @param {[string[]]} valuesParam array with query values.
 * @param {[string[]]} encoder array with query name, and url-code. ex:`%5B%5D` = `[]`
 * @returns Array with query params converted.
 */
function handlerConvertParams(valuesParam:string[], encoder:string[]): string[] {

  /*
    example functionality:

      valuesParams = ['shounen', 'seinen'];

      encoder = ['genero', '%5B%5D']; /-> %5B%5D is '[]'

      handlerConvertParams(valueParamas, encoder) 
      /
      returns /-> ['genero%5B%5D=shounen', 'genero%5B%5D=seinen']
  */
  
  const valid: { [k:string]:{
    [sbk:string]: number | string }} = {
    type: types_parser
  }

  const [ paramName, code ] = encoder;

  const result_arr: string[] = [];


  valuesParam.forEach( value => {

    if( genres.includes(value) && (paramName === 'genero') ){
      // if param name is 'genero' execute this.

      result_arr.push(`${paramName}${code}=${value}`);
      
    } else if (paramName !== 'genero') {

      if( valid[paramName][value] !== undefined ){
        result_arr.push(`${paramName}${code}=${ valid[paramName][value] }`);
      } 
      // if indexed item is not undefined , complete string query.
    }

  });

  return result_arr;
}

/**
 * @param {[filters[]]} filters array of filters to get animes.
 * @description get url from filters.
 * @returns url.
 */
function handlerParseFilters(filters: Filters): string {
  
  /*
    parameters:
      type: tv=0, movie=1, ova=2, special=3
      
      genres:
        [ 'accion', 'artes-marciales', 'aventuras', 'carreras',
          'ciencia-ficcion', 'comedia', 'demencia', 'demonios',
          'deportes', 'drama', 'ecchi', 'escolares', 'espacial',
          'fantasia', 'harem', 'historico', 'infantil', 'josei',
          'juegos', 'magia', 'mecha', 'militar', 'misterio', 'musica',
          'parodia', 'policia', 'psicologico', 'recuentos-de-la-vida',
          'romance', 'samurai', 'seinen', 'shoujo', 'shounen', 'sobrenatural',
          'superpoderes', 'suspenso', 'terror', 'vampiros', 'yaoi', 'yuri' ]

      year: 1950 - 2022

      status: finished:2, broadcast:1, coming soon:3

      sort: '-recent', 'recent'
  */

  // filters default property values does not be allowed.
  // to make it allowed should to be parsed with previous
  // objects.

  var page_query: string = '';

  var {
    types, // []
    genres, // []
    years, // ,
    status,
    sort,
    page
  } = filters;

  if( page!==undefined ){
    page = page<1? 1:page;
    page_query = `p=${page}`;
  } 

  if( years !== undefined ){
    years = years.length < 2? ['1950', '2022']:years;
    // if year is not undefined and length 1 or 0, 
    // set default values.
  }

  types = types !== undefined? types:[]; 
  // if types is not undefined, parse types.

  genres = genres || [];
  // hand shortcut of if undefined.

  status = (
    status_parser[status||'']!==undefined?
    `status=${status_parser[status||'']}`:''
  );
  // check if undefined and set query.

  sort = !(['', undefined].includes(sort))? `sort=${sort}`: '';
  // check if undefined and set query.

  years = years || ['1950', '2022'];
  // years or default value.
  
  const queries: string[] = [
    ...handlerConvertParams(types, ['type', '%5B%5D']),
    ...handlerConvertParams(genres, ['genero','%5B%5D']),
    `year=${years[0]}%2C${years[1]}`,  status, sort, page_query
  ];

  const filtered_queries = queries.filter( 
    query => (typeof query === 'string') && query.length!==0);
  // remove empty strings.

  return `https://tioanime.com/directorio?${filtered_queries.join('&')}`;
  // url.

}

/**
 * @param doc Document to get total pages.
 * @param page Page to compare with total pages.
 * @param err Error returned, not required.
 * @description Check if page greater than total pages.
 * @returns Error passed or default error if any wrong,
 * or 'ok' to confirm that all be right.
 */
function handlerCheckTotalPages(
  doc: Document, 
  page:number, 
  err:TioanimeError=scraper.error['Default Error']
): TioanimeError | 'ok' {

  const total_pages: number = handlerGetTotalPages(doc)
  // get total pages

  if (page > total_pages) {
    return err;
  }

  return 'ok';
  // if 'page' value passed greater than total pages
  // returns error.
}

/**
 * @param doc Document to get total pages.
 * @returns Total pages number.
 */
function handlerGetTotalPages(doc: Document) {
  const page_links: NodeListOf<Element> = doc.querySelectorAll('.page-link');
  const indexer: number = page_links.length > 1 ? page_links.length - 2 : 0;
  const total_pages: number = parseInt(
    handlerGetHtml(page_links[indexer])
  );
  return total_pages;
}

/**
 * @param filters filters to check if are Filters type.
 * @description check if all properties are in Filters type and
 * all properties values are same type that Filters property value type has.
 * @returns string error, or 'ok' to confirm that all be right.
 */
function handlerAreFilters(filters: Filters | ObjectDef): string {

  const filters_properties: Filters = {
    types: [], genres: [], 
    years: [], status: '', 
    sort: '', page: 0
  }
  // properties and types.

  const filters_properties_keys: string[] = Object.keys(filters_properties);
  // properties array.

  let filter_key: keyof Filters;
  // parse for avoid indexer error.
  
  for ( filter_key in filters ) {

    const in_filters: Boolean = filters_properties_keys.includes(filter_key);
    // check if property in filters.

    const correct_type: Boolean = (
      (typeof filters[filter_key]) === 
      (typeof filters_properties[filter_key]) &&
      (typeof filters_properties[filter_key] !== 'undefined') 
    );
    // check if property value type is correct.
    
    if(!(in_filters && correct_type)){
      const typeError: string | undefined = correct_type? '':typeof filters[filter_key];
      // set value that cause typeError for string template.

      const propertyError: string = in_filters? '':filter_key;
      // set key that cause propertyError for string template.

      const error: string = (
        propertyError!==''? 
          `Property '${propertyError}' is not in filters`
          : `Type of '${filter_key}' is not '${typeError}'.`
      );
      // check error type.
      
      return error;
    }

  }

  return 'ok'; // all right!

}

export {
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
  handlerAreFilters
}