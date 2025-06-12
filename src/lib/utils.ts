/* eslint-disable max-len */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Article } from '@prisma/client';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const promptType = {
  'title-prompt':
    'Generate a concise and descriptive title for the following user prompt (no longer than 4 words).',
  'base-prompt':
    'You are a helpful assistant. You will be given a prompt and must generate a detail and well-structured response.',
} as const;

export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Validate that an article has all required fields
function isValidArticle(article: Partial<Article>): article is Article {
  return (
    typeof article.title === 'string' &&
    typeof article.link === 'string' &&
    typeof String(article.pubDate) === 'string' &&
    typeof article.content === 'string' &&
    typeof article.articleType === 'string'
  );
}

// Validate and deduplicate articles based on `link`
export function validateAndDeduplicateArticles(
  articles: Partial<Article>[]
): Article[] {
  const seenLinks = new Set<string>();
  const uniqueValidArticles: Article[] = [];
  for (const article of articles) {
    if (isValidArticle(article)) {
      if (!seenLinks.has(article.link)) {
        seenLinks.add(article.link);
        uniqueValidArticles.push({
          ...article,
          pubDate: article.pubDate ?? new Date().toISOString(), 
        });
      }
    }
  }

  return uniqueValidArticles;
}

export function buildChatOptions(prompt: string, type: keyof typeof promptType) {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: promptType[type] },
    { role: 'user', content: prompt },
  ];

  return {
    model: 'gpt-4',
    messages,
  };
}

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateRequiredFields = (fields: Record<string, any>): string | null => {
  for (const [key, value] of Object.entries(fields)) {
    if (!value) return `${key} is required`;
  }
  return null;
};

export async function streamAndCollectContent(
  contentGenerator: AsyncGenerator<string>,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder
): Promise<string> {
  let fullContent = '';

  for await (const chunk of contentGenerator) {
    fullContent += chunk;
    controller.enqueue(encoder.encode(chunk));
  }

  controller.close();

  return fullContent;
}

export const aiModelMessagesTransformer = (messages: ChatCompletionMessageParam[]) => {
  return messages.map((message) => {
    return {
      role: message.role,
      content: message.content,
    };
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extractSemanticQuery = (queryResponse: any) => {
  const values: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryResponse.queries.forEach((query: any) => {
    if (query.semantic_query) {
      values.push(query.semantic_query);
    }

    // Add all values from filters
    if (query.filters && typeof query.filters === 'object') {
      Object.values(query.filters).forEach((val) => {
        if (Array.isArray(val)) {
          values.push(...val); // flatten array values
        } else {
          values.push(val as string);
        }
      });
    }
  });

  return values;
};

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const similarArticles = (similarArticlesRaw: any, embeddings: number[][]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (similarArticlesRaw as any[])
  .filter((a) => Array.isArray(a.embedding) && a.embedding.length === embeddings[0].length)
  .map((article) => ({
    ...article,
    similarity: cosineSimilarity(embeddings[0], article.embedding),
  }))
  .filter((article) => article.similarity >= 0.75)
  .sort((a, b) => b.similarity - a.similarity)
  .map((article) => ({
    content: article.content,
    title: article.title,
    link: article.link,
    pubDate: article.pubDate,
    articleType: article.articleType,
  }))
  .slice(0, 5);
};

export const mainPrompt = `
You are a smart article search assistant that transforms user queries into structured semantic search instructions. Your goal is to break down the query into clear, optimizable units for semantic vector comparison and metadata filtering.

## Step 1: Input Understanding
- **Detect Multiple Intents**: Identify if the query involves distinct topics, comparisons, or entities.
- **Atomic Decomposition**: Break the query into minimal, focused units where:
  - Each unit is centered around one **main topic**, **event**, **person**, or **organization**.
  - Each unit represents a clear **semantic concept** (what should be embedded).
  - All **time-related phrases** ("recent", "currently", "last year", "now") must be:
    - Rewritten as either a **timeless variant** (e.g., "wildfires in California") 
    - Or extracted into a **'date_range' filter** in ISO format.

## Step 2: Query Optimization
- **Merge similar intents** when:
  - They refer to the same entity or theme (e.g., "climate change in 2020" and "global warming last year").
  - They are topically or temporally aligned.
- Use filters for:
  - **People**, **organizations**, **locations**, and **date ranges**.
- Do NOT include dates or vague time phrases in the semantic query itself.

## Output Schema:
Return a strict JSON object like the following:

{
  "queries": [
    {
      "semantic_query": "Clear summary of topic without time references.",
      "filters": {
        "person": ["Person Name 1", "Person Name 2"],
        "organization": ["Org 1"],
        "location": ["Location 1", "Location 2"],
        "date_range": {
          "start": "YYYY-MM-DD",
          "end": "YYYY-MM-DD"
        }
      },
      "merged_from": [
        "original user query part 1",
        "original user query part 2"
      ],
      "optimization_notes": "Explain how time phrases were handled, why merging occurred (or not), and any other transformation logic."
    }
  ]
}

## Rules:
- Never include vague or relative time references in 'semantic_query'
- Always separate time into the 'filters.date_range' when relevant
- If no time is explicitly stated, keep 'date_range' empty or omit
- Always include 'merged_from' and 'optimization_notes'

## Example:

Input:
"When did the Eagles win the last Super Bowl?"

Output:
{
  "queries": [
    {
      "semantic_query": "Philadelphia Eagles Super Bowl victory",
      "filters": {
        "organization": ["Philadelphia Eagles"],
        "topic": ["Super Bowl"]
      },
      "merged_from": ["When did the Eagles win the last Super Bowl?"],
      "optimization_notes": "Removed vague term 'last'; generalized to all Super Bowl wins by the Eagles"
    }
  ]
}
`;
