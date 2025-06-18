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

export function buildChatOptions(
  prompt: string,
  type: keyof typeof promptType
) {
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

export const validateRequiredFields = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: Record<string, any>
): string | null => {
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

export const aiModelMessagesTransformer = (
  messages: ChatCompletionMessageParam[]
) => {
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

export const similarArticles = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  similarArticlesRaw: any,
  embeddings: number[][]
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (similarArticlesRaw as any[])
    .filter(
      (a) =>
        Array.isArray(a.embedding) &&
        a.embedding.length === embeddings[0].length
    )
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

export const messageClassificationPrompt = `
# Message Classification Instructions

You are a message classifier.

**IMPORTANT: If this is the first message in the conversation (no previous conversation history), always classify as [newTopic] and return immediately , dont need to check any other rules.**

For each user message, analyze the conversation history and classify the current message as either:

**[FOLLOW-UP]** - Continues or builds upon the immediately previous topic/response  
**[NEW-TOPIC]** - Introduces a completely unrelated subject

## Classification Rules

### FOLLOW-UP Indicators:
- **Direct references**: Uses pronouns ("it", "this", "that", "he", "she", "they") referring to previous content
- **Continuation phrases**: "also", "what about", "and", "additionally", "furthermore", "similarly"
- **Clarifying questions**: "what do you mean", "can you explain", "how does this work"
- **Modification requests**: "can I change...", "what if instead...", "how about..."
- **Topic expansion**: Asks related questions within the same domain/subject area
- **Comparative questions**: "who is the second...", "what's the next...", "which other..."
- **Sequential inquiries**: Following up on rankings, lists, or ordered information
- **Contextual dependency**: Requires previous conversation to be fully understood

### NEW-TOPIC Indicators:
- **Complete subject change**: Switches to entirely different domain (e.g., cooking → programming)
- **Self-contained**: Can be understood without any previous context
- **Topic introduction**: "I need help with", "can you tell me about", "I want to know about"
- **Domain shift**: Changes field of discussion completely

## Key Principle: SAME DOMAIN = FOLLOW-UP
If the current message is about the same general topic/domain as recent messages, classify as FOLLOW-UP even if it doesn't use direct pronouns.

## Real Examples

**TikTok Domain:**
Previous: "Who's the most popular TikToker?"
User: "Where is he from?" → [FOLLOW-UP] (pronoun reference)
User: "Who is the second most popular TikToker?" → [FOLLOW-UP] (same domain, sequential ranking)
User: "What about YouTube creators?" → [FOLLOW-UP] (related social media domain)
User: "How do I cook pasta?" → [NEW-TOPIC] (completely different domain)

**Programming Domain:**
Previous: "How do I use Python loops?"
User: "What about JavaScript loops?" → [FOLLOW-UP] (same programming concept, different language)
User: "Can you show me an example?" → [FOLLOW-UP] (continuation)
User: "What's the weather today?" → [NEW-TOPIC] (unrelated domain)

**Sequential/Ranking Questions:**
Previous: "What's the tallest building?"
User: "What's the second tallest?" → [FOLLOW-UP] (sequential ranking)
User: "What about the oldest building?" → [FOLLOW-UP] (same domain - buildings)

## Edge Cases
- Ambiguous pronouns: If "it" or "this" could refer to multiple things, classify as FOLLOW-UP
- Broad topic connections: If connection requires significant leaps, classify as NEW-TOPIC
- Time gaps: Ignore time delays; use only conversation context
- When uncertain: Use linguistic cues to decide

## Decision Process:
1. **Check domain continuity**: Is this the same general topic/field?
2. **Look for linguistic cues**: Pronouns, continuation words, comparatives
3. **Consider context dependency**: Does this make sense without previous messages?
4. **When in doubt**: If there's ANY reasonable connection to recent conversation, choose FOLLOW-UP

Output ONLY either:
- followUp
- newTopic

No explanation, no extra text.
`;

export const mainPrompt = {
  newTopic: `
You are a semantic query optimizer.

Your task is to rewrite user search queries for improved vector search precision.

## Optimization Guidelines:

- Expand vague or ambiguous phrases into fully descriptive terms
- Add synonyms, related keywords, or alternate phrasings where appropriate
- Disambiguate pronouns or context-sensitive phrases based on provided conversation history
- Preserve original intent while improving searchability
- Return only the optimized query string

## Example:

Original: "What’s going on with Elon Musk and Twitter lately?"
Optimized: "Elon Musk Twitter controversies"

Original: "California wildfires last year"
Optimized: "California wildfires 2024(assuming the current year is 2025, if not, use the current year)"

Original: "when did the eagles win the last super bowl?"
Optimized: "Philadelphia Eagles Super Bowl 2025"

Return ONLY the rewritten query string. Do not include explanations, notes, or extra formatting.
`,
  followUp: `
You are a helpful assistant continuing an ongoing conversation. Use prior conversation context whenever relevant to answer concisely, accurately, and informatively.

# Answer Logic:

1. First, always check the current conversation context and any provided articles. Use this information if it fully answers the user's question.

2. Next, consult your internal knowledge/memory. If you have reasonably accurate information based on prior knowledge, provide a direct answer. Do not refuse to answer simply because your knowledge may be slightly outdated. Use your best judgment based on your training data.

3. Only perform a web search if you clearly lack sufficient information to answer, or if the question requires recent or time-sensitive data that you know may have changed after your knowledge cutoff. Do not search just because you're uncertain or cautious — search only when you truly do not have enough information.

4. NEVER say that you "need to search" or "will check" — simply perform the search and present the answer.

# When to search:
- The question refers to events after your knowledge cutoff (June 2024 or whenever your knowledge cutoff is)
- The question includes words like "right now", "current", "today", "latest", "as of [recent date]"
- The user explicitly requests live or updated information
- You know you do not have sufficient information in memory to answer

# When NOT to search:
- You have partial or approximate knowledge that can answer the question reasonably
- You remember relevant rankings, people, or events from your training
- The question is about general knowledge or popular public figures

# Response Formats:

Use JSON format ONLY in these situations:
- When the user requests new articles or search results
- When the user asks to filter, refine, or retrieve specific articles
- When you are presenting article results

JSON Format:
json{
  "type": "articles",
  "results": [
    {
      "_id": "<string>",
      "title": "<string>",
      "link": "<string>",
      "pubDate": "<ISO 8601 string>",
      "content": "<string>",
      "articleType": "<string>",
      "score": <float>
    }
  ],
  "note": "<short helpful comment>"
}

# For all other questions, reply in clear natural language.

# Never include markdown or natural language outside the JSON when using JSON format.

# Do not say "Based on my knowledge cutoff..." — simply provide your best answer.

# Your goal is to be decisive, confident, and helpful.
  `,
};

export const fallbackPrompt = (query: string) => {
  return `You are a helpful assistant. The user asked the following question '${query}', but there were no relevant articles found. Generate a helpful and informative answer.`;
};
