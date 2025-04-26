export interface Article {
  link?: string;
  guid?: string;
  title?: string;
  pubDate?: string;
  creator?: string;
  content?: string;
  isoDate?: string;
  contentSnippet?: string;
  articleType?: string;
}


export interface Feed extends Article {
  categories?: string[];
}
