
export interface ObjectDef {
  [server_name: string]: any
}

export interface Routes {
  search: string;
  anime: string;
  watch: string;
  programming: string;
}

export interface AnimeInfo {
  name: string;
  malId: string;
  anime_id: string;
  chapters: number;
  episodePoster: string;
  poster: string;
  season: string;
  banner: string;
  synopsis: string;
  genres: string[];
  year: string;
  status: string;
  type: string;
  releated: AnimeReleated[];
}

export interface AnimeReleated {
  name: string;
  id: string;
  image: string;
  type: string;
  year: string;
}

export interface AnimeLinks {
  links: ObjectDef;
  id: string;
  chapter: number;
}

export interface ArticleItem {
  name: string;
  id: string;
  poster: string;
}

export interface SectionItem {
  name: string;
  id: string;
  poster: string;
  genres: string[];
  type: string;
  description: string;
}

export interface AnimeAllLatest {
  movies: SectionItem[];
  ovas: SectionItem[];
  specials: SectionItem[];
  animes: ArticleItem[];
  chapters: ArticleItem[];
}

export interface AnimeSearch {
  query: string;
  anime_results: ArticleItem[];
  page: number;
  total_pages: number;  
}

export interface AnimeProgrammingItem {
  name: string;
  id: string;
  image: string;
  chapter: string;
  status: string;
}

export interface AnimeProgramming {
  monday: AnimeProgrammingItem[];
  tuesday: AnimeProgrammingItem[];
  wednesday: AnimeProgrammingItem[];
  thursday: AnimeProgrammingItem[];
  friday: AnimeProgrammingItem[];
  saturday: AnimeProgrammingItem[];
  sunday: AnimeProgrammingItem[];
}

export interface AnimeLatestOptions {
  [chapters:string]: Function;
}

export interface Filters {
  types?: string[];
  genres?: string[];
  years?: string[];
  status?: string;
  sort?: string;
  page?: number;
}

export interface FiltersResult {
  url: string;
  page: number;
  total_pages: number;
  results: ArticleItem[];
}

export interface TioanimeError {
  message: string;
  [extraParameter:string]: string;
}

export interface ErrorTypes {
  [error_name: string]: TioanimeError;
}

// 16