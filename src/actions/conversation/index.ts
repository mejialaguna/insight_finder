import { getErrorMessage, validateRequiredFields } from '@/lib/utils';

import prisma from '../../lib/prisma';
import { generateTitle } from '../openAiAction';

import type {
  ConversationResponse,
  MessageRole,
  MessageResponse,
  MessagesResponse,
} from '@/interfaces';

export type CreateNewTitleResponse = ConversationResponse & {
  messageId?: string;
};

export const getUser = async (userEmail: string) => {
  const error = validateRequiredFields({ userEmail });
  if (error) {
    return { ok: false, error };
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
    });
    return { ok: true, user };
  } catch (error) {
    return { ok: false, error: `getUser: ${getErrorMessage(error)}` };
  }
};

export const createNewConversation = async (
  title: string
): Promise<ConversationResponse> => {
  const error = validateRequiredFields({ title });

  if (error) {
    return {
      ok: false,
      error,
    };
  }

  try {
    const { ok, user } = await getUser('mejialaguna@gmail.com');
    if (!ok || !user) {
      return { ok: false, error: 'User not found' };
    }

    const newConversation = await prisma.conversation.create({
      data: {
        title,
        userId: user.id,
      },
    });

    return newConversation?.id
      ? { ok: true, conversationId: newConversation.id }
      : { ok: false, error: 'Failed to create new conversation' };
  } catch (error) {
    return {
      ok: false,
      error: `createNewConversation: ${getErrorMessage(error)}`,
    };
  }
};

export const createNewMessage = async (
  conversationId: string,
  content: string,
  role: MessageRole
): Promise<MessageResponse> => {
  const error = validateRequiredFields({ conversationId, content, role });

  if (error) {
    return {
      ok: false,
      error,
    };
  }

  try {
    const newMessage = await prisma.message.create({
      data: {
        content,
        conversationId,
        role,
      },
    });

    return newMessage?.id
      ? {
          ok: true,
          messageId: newMessage.id,
          content: newMessage.content,
          role: newMessage.role as MessageRole,
        }
      : { ok: false, error: 'Failed to create new message' };
  } catch (error) {
    return {
      ok: false,
      error: `createNewMessage: ${getErrorMessage(error)}`,
    };
  }
};

export async function createNewTitle(
  prompt: string
): Promise<CreateNewTitleResponse> {
  const error = validateRequiredFields({ prompt });

  if (error) {
    return {
      ok: false,
      error,
    };
  }

  try {
    const title = await generateTitle(prompt);

    const { ok, conversationId, error } = await createNewConversation(title);

    if (!ok || !conversationId) {
      throw new Error(error || 'Failed to create new conversation');
    }

    const { ok: messageOk, messageId } = await createNewMessage(
      conversationId,
      prompt,
      'user'
    );

    return messageOk
      ? { ok: true, conversationId, title, messageId }
      : { ok: false, error: 'Failed to create new message' };
  } catch (error) {
    return {
      ok: false,
      error: `createNewTitle: ${getErrorMessage(error)}`,
    };
  }
}

export const getConversationMessages = async (
  conversationId: string
): Promise<MessagesResponse> => {
  const error = validateRequiredFields({ conversationId });

  if (error) {
    return {
      ok: false,
      error,
    };
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    return messages.length > 0
      ? { ok: true, messages }
      : { ok: false, error: 'No messages found' };
  } catch (error) {
    return {
      ok: false,
      error: `getConversationMessages: ${getErrorMessage(error)}`,
    };
  }
};

export const getConversations = async (email: string) => {
  const error = validateRequiredFields({ email });

  if (error) {
    return { ok: false, error };
  }

  try {
    const { ok, user } = await getUser(email);

    if (!ok || !user) {
      return { ok: false, error: 'User not found' };
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });
    return { ok: true, conversations };
  } catch (error) {
    return { ok: false, error: `getConversations: ${getErrorMessage(error)}` };
  }
};
