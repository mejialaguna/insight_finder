/* eslint-disable no-console */
import { type NextRequest, NextResponse } from 'next/server';

import { createNewMessage, createNewTitle } from '@/actions/conversation';
import { generateContent } from '@/actions/openAiAction';
import { auth } from '@/lib/auth-no-edge';
import { streamAndCollectContent, validateRequiredFields } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session?.user?.email || '';

    const { prompt, conversation_id, messages} = await req.json();
    let localConversationId = conversation_id;
    let message_Id: string | undefined;
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
      const { ok, conversationId, error, messageId } = await createNewTitle(prompt, userEmail);

      if (!ok || !conversationId || error) {
        throw new Error(error || 'Failed to create new title');
      }

      localConversationId = conversationId;
      message_Id = messageId;
    } else {
      // this will create a new message to the conversation
      // saving the user prompt to the conversation
      const { ok, messageId } = await createNewMessage(localConversationId, prompt, 'user');

      if (!ok || !messageId) {
        throw new Error('Failed to create new message');
      }

      message_Id = messageId;
    }

    const encoder = new TextEncoder();
    const content = await generateContent(messages);

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
        'X-Message-Id': message_Id || '',
        'X-Conversation-Id': localConversationId || '',
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
