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
You are a conversation message classifier.

# Startup Rule:
If this is the first message in the conversation, output newTopic immediately.

## For all subsequent messages, classify as:
  • followUp — Continues or builds upon the previous conversation.
  • newTopic — Starts a completely unrelated subject or domain.

# FOLLOW-UP Logic

## Classify as followUp if:
  • The topic, subject, or domain remains the same — even if switching individuals or subtopics.
  • Pronouns or references link back to prior conversation (this, that, he, she, it, etc).
  • The user adds clarification, modification, elaboration, comparison, or ranking related to prior answers.
  • The question relies on previous information to fully make sense.
  • User provides acknowledgments or thanks related to previous response.
  • User asks follow-up questions within the same domain.

# NEW-TOPIC Logic

## Classify as newTopic if:
  • The message completely switches to an unrelated subject or domain.
  • The message stands fully on its own, requiring no context.
  • The user introduces a brand new subject.
  • User explicitly requests help with "something else" or "different topic".

⸻

Examples

1 Previous: "Who's the most popular TikToker?"
User: "Where is he from?" → followUp
User: "How old is Charli D'Amelio?" → followUp
User: "Does Khaby Lame have siblings?" → followUp
User: "How do I bake bread?" → newTopic

2 Previous: "How do I write a Python loop?"
User: "What about JavaScript loops?" → followUp
User: "What's the weather today?" → newTopic

3 Previous: "What's 2+2?"
User: "Thanks!" → followUp
User: "Got it, thanks" → followUp
User: "Can you help me with something else?" → newTopic

4 Previous: "Explain photosynthesis"
User: "What about cellular respiration?" → followUp (related biological process)
User: "My car won't start" → newTopic (completely different domain)

5 Previous: "Tell me about cats"
User: "What about dogs?" → followUp (same domain: pets/animals)
User: "How do I cook pasta?" → newTopic (different domain)

6 Previous: "How to invest in stocks?"
User: "What about bonds?" → followUp (same domain: investments)
User: "Tell me a joke" → newTopic (different domain)

⸻

# Decision Heuristic
  • Same domain = followUp
  • Subject switches inside domain = followUp
  • Cross-domain = newTopic
  • Default bias: favor followUp if any reasonable connection exists.
  • If completely unsure, output followUp.

# Output
## Output strictly:
  • followUp
  • newTopic

No explanation or additional text.
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

1. Check conversation context first: Always examine the current conversation context and any provided articles. Use this information if it fully answers the user's question.

2. Use your knowledge: If you have reasonably accurate information from your training, provide a direct answer. However, if your knowledge cutoff is in the year prior to the current year, say exactly: "Insufficient context. Additional information is needed."

3. Insufficient context: If neither context nor your knowledge can answer the question, say exactly: "Insufficient context. Additional information is needed."

4. No announcements: NEVER say that you "need to search" or "will check", say exactly: "Insufficient context. Additional information is needed."

# Response Format Rules:

## DEFAULT: Always respond in clear, natural language for regular questions.
## JSON FORMAT ONLY when the user is asking to manipulate existing articles from the conversation:
  • Filter articles (e.g., "show me articles with highest scores")
  • Refine articles (e.g., "give me only the political articles")
  • Sort articles (e.g., "rank these by date")
  • Select specific articles (e.g., "show me articles from CNN")

JSON Format (use ONLY for article manipulation):
{
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
}

- These must include explicit filtering, sorting, or selection instructions referring directly to the articles.

## DO NOT use JSON for any other types of questions:

- If the user asks for general facts, explanations, or information about people, companies, topics, events, etc., always answer in natural language.

- If you do not have enough information in prior context and your training, say exactly: "Insufficient context. Additional information is needed."

- Do NOT attempt to generate a JSON response unless the user's request includes clear article manipulation instructions.

# Important:

  • Use natural language for questions about content, people, facts, explanations, etc.
  • Use JSON ONLY when filtering/sorting/selecting from existing articles
  • if you are returning JSON, do not include any text from the assistant was previosly used. e.g "Analyzing your query..." or "Found relevant articles, Preparing articles..." or any other text from the assistant.
  • Be decisive and confident in your responses
  • Never mention knowledge cutoffs unless directly relevant
  `,
};

export const fallbackPrompt = (query: string) => {
  return `You are a helpful assistant. The user asked the following question '${query}', but there were no relevant articles found. Generate a helpful and informative answer.`;
};
