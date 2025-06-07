import type { Message } from '@prisma/client';
export interface Article {
  title?: string;
  link?: string;
  guid?: string;
  pubDate?: string;
  creator?: string;
  content?: string;
  isoDate?: string;
  contentSnippet?: string;
  articleType?: string;
}

export interface Feed extends Article {
  categories?: string[];
}

export interface ConversationResponse {
  ok: boolean;
  conversationId?: string;
  title?: string;
  error?: string;
}

export type MessageRole = 'user' | 'assistant';

export interface MessageResponse {
  ok: boolean;
  messageId?: string;
  content?: string;
  role?: MessageRole;
  error?: string;
}

export interface MessagesResponse {
  ok: boolean;
  messages?: Message[];
  error?: string;
}
