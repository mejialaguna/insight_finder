import 'server-only';

import { embedBatch } from '@/helpers/seed-helper';
import { openaiClient } from '@/lib/openai-client';
import prisma from '@/lib/prisma';
import {
  buildChatOptions,
  fallbackPrompt,
  mainPrompt,
  messageClassificationPrompt,
} from '@/lib/utils';

import type {
  ChatCompletionChunk,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
} from 'openai/resources/index.mjs';
import type { Stream } from 'openai/streaming.mjs';

const optionsGenerator = (
  messages: ChatCompletionMessageParam[],
  systemContent: string
): ChatCompletionCreateParamsStreaming => {
  const prompt = {
    classification: messageClassificationPrompt,
    newTopic: mainPrompt.newTopic,
    followUp: mainPrompt.followUp,
  };

  return {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: prompt[systemContent as keyof typeof prompt] },
      ...messages,
    ],
    stream: true,
  };
};

async function* streamOpenAI(
  options: ChatCompletionCreateParamsStreaming
): AsyncGenerator<string> {
  const stream = (await openaiClient.chat.completions.create(
    options
  )) as Stream<ChatCompletionChunk>;

  for await (const chunk of stream) {
    const content = chunk?.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

async function* yieldStatus(message: string): AsyncGenerator<string> {
  for await (const token of streamTextTokens(`${message}\n`, 50)) {
    yield JSON.stringify({ type: 'status', results: token });
  }
}

async function collectStream(stream: AsyncGenerator<string>): Promise<string> {
  let fullResponse = '';
  for await (const chunk of stream) {
    fullResponse += chunk;
  }
  return fullResponse.trim();
}

export async function* generateContent(messages: ChatCompletionMessageParam[]) {
  try {
    yield* yieldStatus('Analyzing your query...');

    const classificationOptions = optionsGenerator(messages, 'classification');
    const classificationStream = streamOpenAI(classificationOptions);
    const fullResponse = await collectStream(classificationStream);
    console.log('fullResponse ======>', fullResponse);
    if (fullResponse === 'newTopic') {
      const newTopicOptions = optionsGenerator(messages, fullResponse);
      const newTopicStream = streamOpenAI(newTopicOptions);
      const optimizedQuery = await collectStream(newTopicStream);
      console.log('optimizedQuery ======>', optimizedQuery);

      const embeddings = await embedBatch([optimizedQuery]);

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

      if (results.length > 0) {
        yield* yieldStatus('Found relevant articles, Preparing articles...');

        await new Promise((resolve) => setTimeout(resolve, 700));

        yield JSON.stringify({ type: 'articles', results });
        return;
      }

      yield* yieldStatus(
        'No relevant articles found. Generating a helpful summary instead...'
      );

      const fallback = {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: fallbackPrompt(fullResponse) },
          ...messages,
        ],
        stream: true,
      } as ChatCompletionCreateParamsStreaming;

      const fallbackStream = streamOpenAI(fallback);

      for await (const chunk of fallbackStream) {
        yield JSON.stringify({ type: 'status', results: chunk });
      }

      return;
    } else if (fullResponse === 'followUp') {
      const followUpOptions = optionsGenerator(messages, fullResponse);
      const followUpStream = streamOpenAI(followUpOptions);

      for await (const chunk of followUpStream) {
         console.log('followUp chunk:', chunk);
        yield JSON.stringify({ type: 'status', results: chunk });
      }

      return;
    } else {
      throw new Error(`Unknown classification response: ${fullResponse}`);
    }
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Failed to generate content. Please try again.');
  }
}

export async function* streamTextTokens(text: string, delay = 0) {
  const tokens = text.match(/\S+|\s+|[^\w\s]+/g) || [];

  for (const token of tokens) {
    yield token;
    if (delay > 0) {
      await new Promise((res) => setTimeout(res, delay)); // Optional delay
    }
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
