'use server';

import 'server-only';
import Parser from 'rss-parser';

import type { Article, Feed } from '@/interfaces';

const parser = new Parser();

interface FeedResponse {
  ok: boolean;
  articles: Article[];
  message?: string;
}

// eslint-disable-next-line max-len
const feedUrls = [
  'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  'https://rss.nytimes.com/services/xml/rss/nyt/US.xml',
];

export default async function getFeed(): Promise<FeedResponse> {
  try {
    const feedPromises = feedUrls.map((url) => parser.parseURL(url));
    const feeds = await Promise.all(feedPromises);

    const articles:Feed[] = feeds.flatMap((feed) =>
      (feed.items || []).map((item) => ({
        ...item,
        articleType: feed.title?.replace('NYT > ', '') || 'Unknown',
      }))
    );

    if (!articles?.length) {
      return {
        ok: false,
        articles: [],
      };
    }

    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    const cleanedArticles: Article[] = articles.map(({ categories, ...rest }) => rest);

    return {
      ok: true,
      articles: cleanedArticles,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching Reuters RSS:', error);
    return {
      ok: false,
      articles: [],
      message: `Error fetching Reuters RSS: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
