'use client';
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
  const { shouldShowNewConversation } = useNewConversationFeature();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [conversationMessages, setConversationMessages] = useState<Message[]>(
    messages || []
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleAction = useCallback(
    async (formData: FormData) => {
      const prompt = formData.get('prompt') as string;
      setIsThinking(true);
      setIsGenerating(true);
  
      const localConversationId = conversationId || `${crypto.randomUUID()}-newConversation`;
  
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: prompt,
        conversationId: localConversationId,
        timestamp: new Date(),
      };

      setConversationMessages((prev) => [...prev, userMessage]);

      // Wait one paint frame to let DOM update before fetch
      requestAnimationFrame(async () => {
        try {
          const res = await fetch('/api/generate', {
            method: 'POST',
            body: JSON.stringify({
              prompt,
              ...(conversationId && { conversation_id: conversationId }),
            }),
          });
  
          if (!res.ok) throw new Error('Failed to fetch content');
          if (!res.body) throw new Error('No response body');
  
          const c_Id = res.headers.get('X-Conversation-Id');
          if (c_Id && c_Id !== conversationId) {
            router.replace(`?conversationId=${c_Id}`);
          }
  
          setIsThinking(false);
  
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          const newMessageId = crypto.randomUUID();
          let accumulatedText = '';
  
          // Add empty assistant message
          setConversationMessages((prev) => [
            ...prev,
            {
              id: newMessageId,
              role: 'assistant',
              content: '',
              conversationId: localConversationId,
              timestamp: new Date(),
            },
          ]);
  
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            accumulatedText += chunk;
  
            setConversationMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === newMessageId ? { ...msg, content: accumulatedText } : msg
              )
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
    [conversationId, router]
  );

  useEffect(() => {
    setConversationMessages(messages || []);
  }, [messages, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  return (
    <div className='flex flex-col h-[92vh] gap-4 px-4 pt-4'>
      {shouldShowNewConversation && !conversationId ? (
        <ChatInterface
          handleAction={handleAction}
          isGenerating={isGenerating}
        />
      ) : (
        <div className='flex flex-1 flex-col gap-4 overflow-hidden'>
          {/* Top: Chat Section */}
          <div className='flex-1 rounded-xl bg-muted/50 p-4 overflow-auto'>
            {conversationMessages?.map((message) => (
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
                <p className='content-center'>{message.content}</p>
              </div>
            ))}
            <div ref={bottomRef} />
            {isThinking && (
              <div className='thinking-dots mb-6'>
                Thinking
                <span className='ml-1' />
                <span />
                <span />
              </div>
            )}
          </div>
          {/* ChatForm stays pinned at bottom */}
          <ChatForm
            className='pt-4'
            handleAction={handleAction}
            isGenerating={isGenerating}
          />
        </div>
      )}
    </div>
  );
}
