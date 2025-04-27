export interface Article {
  title?: string;
  link?: string;
  guid?: string;
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
