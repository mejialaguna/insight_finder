'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { useNewConversationFeature } from '@/store';

import { ChatForm } from './chat-form';
import { ChatInterface } from './chat-interface';

import type { Message } from '@prisma/client';

interface FeatureAreaProp {
  conversationId?: string;
  messages?: Message[];
}

export default function FeatureArea({
  conversationId,
  messages,
}: FeatureAreaProp) {
  const router = useRouter();
  const { shouldShowNewConversation, setShouldShowNewConversation } =
    useNewConversationFeature();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [conversationMessages, setConversationMessages] = useState<Message[]>(
    messages || []
  );
  const [conId, setConId] = useState<string>(conversationId || '');
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleAction = useCallback(
    async (formData: FormData) => {
      const prompt = formData.get('prompt') as string;
      setIsThinking(true);
      setIsGenerating(true);

      if (shouldShowNewConversation) setShouldShowNewConversation(false);

      const localConversationId =
        conId || `${crypto.randomUUID()}-newConversation`;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: prompt,
        conversationId: localConversationId,
        timestamp: new Date(),
      };

      setConversationMessages((prev) => [...prev, userMessage]);

      const openAIMessages = [...conversationMessages, userMessage].map(
        (msg) => ({
          role: msg.role,
          content: msg.content,
        })
      );

      // Wait one paint frame to let DOM update before fetch
      requestAnimationFrame(async () => {
        try {
          const res = await fetch('/api/generate', {
            method: 'POST',
            body: JSON.stringify({
              prompt,
              messages: openAIMessages,
              ...(conversationId && { conversation_id: conversationId }),
            }),
          });

          if (!res.ok) throw new Error('Failed to fetch content');
          if (!res.body) throw new Error('No response body');

          const c_Id = res.headers.get('X-Conversation-Id');
          const m_Id = res.headers.get('X-Message-Id');

          if (c_Id && c_Id !== conversationId) {
            setConId(c_Id);
          }

          setIsThinking(false);

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let accumulatedText = '';

          // Add empty assistant message
          setConversationMessages((prev) => [
            ...prev,
            {
              id: m_Id as string,
              role: 'assistant',
              content: '',
              conversationId: c_Id as string,
              timestamp: new Date(),
            },
          ]);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            accumulatedText += chunk;

            setConversationMessages((prevMessages) =>
              prevMessages.map((msg) => {
                if (msg.id !== m_Id || msg.role !== 'assistant') return msg;

                try {
                  const parsed = JSON.parse(accumulatedText);
                  return { ...msg, content: parsed };
                } catch {
                  // Not yet fully parsable JSON, just update raw text
                  return { ...msg, content: accumulatedText };
                }
              })
            );
          }
        } catch (err) {
          setIsGenerating(false);
          setIsThinking(false);
          // setError('Failed to generate content. Please try again.');
          // eslint-disable-next-line no-console
          console.error(err);
        } finally {
          setIsGenerating(false);
          setIsThinking(false);
        }
      });
    },
    [
      shouldShowNewConversation,
      setShouldShowNewConversation,
      conId,
      conversationMessages,
      conversationId,
    ]
  );
  console.log('conversationMessages', conversationMessages);
  useEffect(() => {
    setConversationMessages(messages || []);
  }, [messages, conversationId]);

  useEffect(() => {
    if (!conversationId && conId && !isGenerating) {
      router.replace(`?conversationId=${conId}`);
    }
  }, [conId, conversationId, isGenerating, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  return (
    <div className="flex flex-col h-[92vh] gap-4 px-4 pt-4">
      {shouldShowNewConversation && !conversationId ? (
        <ChatInterface />
      ) : (
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          {/* Top: Chat Section */}
          <div className="flex-1 rounded-xl bg-muted/50 p-4 overflow-auto">
            {conversationMessages?.map((message) => {
              const isAssistant = message.role === 'assistant';
              let parsedContent = message.content;

              if (isAssistant && typeof message.content === 'string') {
                try {
                  parsedContent = JSON.parse(message.content);
                } catch {
                  // Not yet JSON — leave as string
                }
              }
              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-6 mb-6',
                    message.role === 'user' ? ' flex-row-reverse' : ''
                  )}
                >
                  <span
                    className={cn(
                      'flex items-center justify-center rounded-full bg-slate-300 px-4 py-1 h-full'
                    )}
                  >
                    {message.role === 'user' ? 'Me' : 'Assistant'}
                  </span>
                  <div className="content-center">
                    {!isAssistant ? (
                      <p>{message.content}</p>
                    ) : Array.isArray(parsedContent) ? (
                      <div className="flex flex-col gap-4">
                        <AnimatePresence>
                          {parsedContent.map((item, idx) => (
                            <motion.div
                              key={item.link || idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.1 }}
                              className="border p-4 rounded-md bg-white shadow"
                            >
                              <h3 className="font-semibold text-lg">
                                {item.title}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {item.articleType}
                              </p>
                              <p className="mb-2">{item.content}</p>
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 underline text-sm"
                              >
                                Read more
                              </a>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <p>{parsedContent}</p>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
            {isThinking && (
              <div className="thinking-dots mb-6">
                Thinking
                <span className="ml-1" />
                <span />
                <span />
              </div>
            )}
          </div>
          {/* ChatForm stays pinned at bottom */}
        </div>
      )}
      <ChatForm
        className="pt-4"
        handleAction={handleAction}
        isGenerating={isGenerating}
      />
    </div>
  );
}
