'use server';

import cliProgress from 'cli-progress';
import Parser from 'rss-parser';

import { openai } from './openai-client';

import type { Article, Feed } from '../seed/seed';

const parser = new Parser();
const BATCH_SIZE = 20;
const MAX_CHARACTERS = 12000;

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

/**
 * Fetches and parses RSS feeds from configured news sources.
 * Currently fetches from NYT World and US feeds.
 * @returns {Promise<FeedResponse>} Object containing success status and parsed articles
 */
export default async function getFeed(): Promise<FeedResponse> {
  try {
    const feedPromises = feedUrls.map((url) => parser.parseURL(url));
    const feeds = await Promise.all(feedPromises);

    const articles: Feed[] = feeds.flatMap((feed) =>
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
    const cleanedArticles: Article[] = articles.map(
      ({ categories: _categories, ...rest }) => rest
    );

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

/**
 * Combines article title and content into a single string, ensuring it doesn't exceed the maximum character limit.
 * @param {string} title - The article title
 * @param {string} content - The article content
 * @returns {string} Combined title and content, truncated if necessary
 */
export function combineTitleAndContent(title: string, content: string): string {
  let combined = `${title}\n\n${content}`;
  if (combined.length > MAX_CHARACTERS) {
    combined = combined.slice(0, MAX_CHARACTERS);
  }
  return combined;
}

/**
 * Generates embeddings for a batch of articles using OpenAI's embedding API.
 * Processes articles in batches to handle API limits and optimize performance.
 * @param {Array<{title: string, content: string}>} articles - Array of articles to generate embeddings for
 * @returns {Promise<number[][]>} Array of embedding vectors for each article
 */
export async function batchGenerateEmbeddings(articles: { title: string; content: string }[]): Promise<number[][]> {
  const results: number[][] = [];

  // Create a new progress bar instance
  const progressBar = new cliProgress.SingleBar({
    format: 'Embedding Progress |{bar}| {percentage}% || {value}/{total} Batches',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  });

  // Start the progress bar
  const totalBatches = Math.ceil(articles.length / BATCH_SIZE);
  progressBar.start(totalBatches, 0);

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const inputs = batch.map(({ title, content }) => combineTitleAndContent(title, content));

    const response = await openai.embeddings.create({
      input: inputs,
      model: 'text-embedding-ada-002',
    });

    const embeddings = response.data.map((item) => item.embedding);
    results.push(...embeddings);

    // Increment progress bar
    progressBar.increment();
  }

  // Stop the progress bar when done
  progressBar.stop();

  return results;
}

// Helper to validate embedding arrays
export function isValidEmbedding(embedding: unknown): embedding is number[] {
  return Array.isArray(embedding) && embedding.length === 1536 && embedding.every((n) => typeof n === 'number');
}
