/* eslint-disable no-console */
import { type NextRequest, NextResponse } from 'next/server';

import { createNewMessage, createNewTitle } from '@/actions/conversation';
import { generateContent } from '@/actions/openAiAction';
import { streamAndCollectContent, validateRequiredFields } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { prompt, conversation_id } = await req.json();
    let localConversationId = conversation_id;
    const error = validateRequiredFields({ prompt });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    if (conversation_id && typeof conversation_id !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid user id' },
        { status: 400 }
      );
    }

    if (!localConversationId) {
      // this will create a new conversation, title and new message if is a new conversation
      const { ok, conversationId, error } = await createNewTitle(prompt);

      if (!ok || !conversationId || error) {
        throw new Error(error || 'Failed to create new title');
      }

      localConversationId = conversationId;
    } else {
      // this will create a new message to the conversation
      // saving the user prompt to the conversation
      await createNewMessage(localConversationId, prompt, 'user');
    }

    const encoder = new TextEncoder();
    const content = await generateContent({
      prompt,
      conversation_id,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const fullResponse = await streamAndCollectContent(
            content,
            controller,
            encoder
          );

          // saving the assistant response to the conversation
          if (fullResponse) {
            await createNewMessage(
              localConversationId,
              fullResponse,
              'assistant'
            );
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain',
        ...(!conversation_id && { 'X-Conversation-Id': localConversationId }),
      },
    });
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: `Failed to generate content ${error}` },
      { status: 500 }
    );
  }
}
