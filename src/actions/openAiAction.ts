import { openaiClient } from '@/lib/openai-client';
import { buildChatOptions } from '@/lib/utils';

type GenerateOptions = {
  prompt: string;
  conversation_id: string;
};

export async function* generateContent({
  prompt,
}: GenerateOptions) {
  try {
    const options = buildChatOptions(prompt, 'base-prompt');
    const stream = await openaiClient.chat.completions.create({
      ...options,
      stream: true,
    });

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
