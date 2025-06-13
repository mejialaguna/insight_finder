import 'server-only';

import { embedBatch } from '@/helpers/seed-helper';
import { openaiClient } from '@/lib/openai-client';
import prisma from '@/lib/prisma';
import { buildChatOptions, extractSemanticQuery, mainPrompt } from '@/lib/utils';

import type {
  ChatCompletionChunk,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
} from 'openai/resources/index.mjs';
import type { Stream } from 'openai/streaming.mjs';

export async function* generateContent(messages: ChatCompletionMessageParam[]) {
  try {
    const options = {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: mainPrompt,
        },
        ...messages,
      ],
      stream: true,
    };
    // eslint-disable-next-line max-len
    const stream = (await openaiClient.chat.completions.create(
      options as ChatCompletionCreateParamsStreaming
    )) as Stream<ChatCompletionChunk>;
    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk?.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        yield '';
      }
    }

    const parsed = JSON.parse(fullResponse);
    const semanticKeys = extractSemanticQuery(parsed);
    const embeddings = await embedBatch(semanticKeys);

    const articles = (await prisma.$runCommandRaw({
      aggregate: 'articles',
      pipeline: [
        {
          $vectorSearch: {
            index: 'articles',
            path: 'embedding',
            queryVector: embeddings[0],
            numCandidates: 100,
            limit: 20,
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            content: 1,
            link: 1,
            articleType: 1,
            pubDate: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
        { $match: { score: { $gte: 0.7 } } },
        { $sort: { score: -1 } },
        { $limit: 5 },
      ],
      cursor: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any;

    const results = articles.cursor.firstBatch || [];

    yield JSON.stringify(results);
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Failed to generate content. Please try again.');
  }
}

export async function generateTitle(prompt: string) {
  try {
    const options = buildChatOptions(prompt, 'title-prompt');
    const titleResponse = await openaiClient.chat.completions.create(options);

    const title =
      titleResponse.choices[0].message.content?.trim() ||
      'Untitled Conversation';

    return title;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Failed to generate title. Please try again.');
  }
}
