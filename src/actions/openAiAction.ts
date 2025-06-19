import 'server-only';

import { checkIsValidJsonType } from '@/helpers/parseMessages';
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
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
} from 'openai/resources/index.mjs';
import type { Stream } from 'openai/streaming.mjs';

function isAnswerInsufficient(response: string): boolean {
  const vaguePhrases = [
    'I have information about',
    'I can provide more details',
    'I can search',
    'not sure',
    'I cannot verify',
    'if you want, I can',
    'depends',
    'hard to say',
    'I currently do not have',
    'Would you like me',
    "I don't have",
    'i do not',
    'there is no specific',
    'Based on available information',
    "There isn't specific public information",
    'Not enough information',
    "I don't have information",
    'No data available',
    'Cannot find details',
    'Insufficient data',
    'Insufficient context',
  ];

  if (response.length < 50) return true;

  return vaguePhrases.some((phrase) =>
    response.toLowerCase().includes(phrase.toLowerCase())
  );
}

const optionsGenerator = (
  messages: ChatCompletionMessageParam[],
  systemContent: string,
  model: string = 'gpt-3.5-turbo'
): ChatCompletionCreateParamsStreaming => {
  const prompt = {
    classification: messageClassificationPrompt,
    newTopic: mainPrompt.newTopic,
    followUp: mainPrompt.followUp,
  };

  return {
    model,
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

function buildClassificationMessages(
  conversation: ChatCompletionMessageParam[]
): ChatCompletionMessageParam[] {
  const relevantMessages: ChatCompletionMessageParam[] = [];

  // Walk backwards through conversation to get last assistant-user pair
  for (let i = conversation.length - 1; i >= 0; i--) {
    const m = conversation[i];
    relevantMessages.unshift(m);

    // Stop when we see assistant followed by user — i.e. 1 full exchange
    if (m.role === 'assistant') {
      if (i > 0 && conversation[i - 1]?.role === 'user') {
        relevantMessages.unshift(conversation[i - 1]);
        break;
      }
    }
  }

  // If no assistant found (only initial user message), fallback to last 1-2 user messages
  if (!relevantMessages.some((m) => m.role === 'assistant')) {
    const userMessages = conversation.filter((m) => m.role === 'user');
    return userMessages.slice(-2);
  }

  return relevantMessages;
}

export async function* generateContent(messages: ChatCompletionMessageParam[]) {
  try {
    yield* yieldStatus('Analyzing your query...');

    const classificationMessages = buildClassificationMessages(messages);

    const classificationOptions = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: messageClassificationPrompt },
        ...classificationMessages,
      ],
    };

    const classificationResponse = await openaiClient.chat.completions.create(
      classificationOptions as ChatCompletionCreateParamsNonStreaming
    );
    const fullResponse =
      classificationResponse.choices?.[0]?.message?.content?.trim() ?? '';

    if (fullResponse && !['followUp', 'newTopic'].includes(fullResponse)) {
      // eslint-disable-next-line no-console
      console.log(
        'fullResponse ======> not followUp or newTopic',
        fullResponse
      );
    }

    // if (!['followUp', 'newTopic'].includes(fullResponse)) {
    //   throw new Error(`Unknown classification response: ${fullResponse}`);
    // }

    if (fullResponse === 'newTopic') {
      const newTopicOptions = optionsGenerator(messages, fullResponse);
      const newTopicStream = streamOpenAI(newTopicOptions);
      const optimizedQuery = await collectStream(newTopicStream);

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
      const stream = (await openaiClient.chat.completions.create(
        followUpOptions
      )) as Stream<ChatCompletionChunk>;

      let fullFollowResponse = '';

      for await (const chunk of stream) {
        const content = chunk?.choices[0]?.delta?.content || '';
        if (content) {
          fullFollowResponse += content;
        }
      }

      const jsonMatches = fullFollowResponse.match(/\{.*?\}(?=\{|\s*$)/gs);

      if (jsonMatches) {
        const jsonStringResponse = checkIsValidJsonType(jsonMatches);

        if (jsonStringResponse.type === 'articles') {
          yield* yieldStatus('Preparing articles...');

          await new Promise((resolve) => setTimeout(resolve, 700));

          yield JSON.stringify(jsonStringResponse);
          return;
        } else {
          fullFollowResponse = jsonStringResponse;
        }
      }

      if (isAnswerInsufficient(fullFollowResponse) === false) {
        for await (const token of streamTextTokens(
          fullFollowResponse.trim(),
          50
        )) {
          yield JSON.stringify({ type: 'status', results: token });
        }
        return;
      } else {
        const recentMessages = messages.slice(-1);

        // Flatten into a string
        const conversationContext = recentMessages
          .map((msg) => {
            return `${msg.role.toUpperCase()}: ${msg.content}`;
          })
          .join('\n');

        const response = await openaiClient.responses.create({
          model: 'gpt-4.1',
          tools: [{ type: 'web_search_preview' }],
          input: conversationContext,
        });

        // const messageOutput = response.output.find(
        //   (item) => item.type === 'message'
        // );

        // console.log('messageOutput ======>', messageOutput?.content);

        for await (const token of streamTextTokens(
          response.output_text.trim(),
          50
        )) {
          yield JSON.stringify({ type: 'status', results: token });
        }
      }
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
