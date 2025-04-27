import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Article } from '@prisma/client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
