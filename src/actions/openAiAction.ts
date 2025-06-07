import { openaiClient } from '@/lib/openai-client';
import { buildChatOptions } from '@/lib/utils';

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
          content:
            // eslint-disable-next-line max-len
            'You are a helpful assistant. You will be given a prompt and must generate a detail and well-structured response.',
        },
        ...messages,
      ],
      stream: true,
    };
    // eslint-disable-next-line max-len
    const stream = (await openaiClient.chat.completions.create(
      options as ChatCompletionCreateParamsStreaming
    )) as Stream<ChatCompletionChunk>;

    for await (const chunk of stream) {
      const content = chunk?.choices[0]?.delta?.content || '';
      if (content) {
        yield content; // Stream each chunk of the response
      }
    }
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
