'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { extractJsonFromContent } from '@/helpers/parseMessages';
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

      if (!prompt || prompt.trim() === '') return;

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
            if (done) {
              setIsThinking(false);
              break;
            }
            const chunk = decoder.decode(value);
            accumulatedText += chunk;

            setConversationMessages((prevMessages) =>
              prevMessages.map((msg) => {
                if (msg.id !== m_Id || msg.role !== 'assistant') return msg;

                return { ...msg, content: accumulatedText };
              })
            );
          }
        } catch (err) {
          setIsGenerating(false);
          setIsThinking(false);

          // eslint-disable-next-line no-console
          console.error(err);
        } finally {
          setIsGenerating(false);
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
    <div className='flex flex-col h-[92vh] gap-4 px-4 pt-4'>
      {shouldShowNewConversation && !conversationId ? (
        <ChatInterface />
      ) : (
        <div className='flex flex-1 flex-col gap-4 overflow-hidden'>
          <div className='flex-1 rounded-xl bg-muted/50 p-4 overflow-auto'>
            {conversationMessages?.map((message) => {
              const isAssistant = message.role === 'assistant';
              const newContent = extractJsonFromContent(message.content);
              const aiModelMessage = newContent?.statusText;
              const aiModelArticles = newContent?.articles;

              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-6 mb-6',
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  )}
                >
                  <span className='flex items-center justify-center rounded-full bg-slate-300 px-4 py-1 h-full'>
                    {message.role === 'user' ? 'Me' : 'Assistant'}
                  </span>
                  <div className='content-center space-y-4'>
                    {!isAssistant && (
                      <p className='border p-4 rounded-md bg-white shadow'>
                        {message.content}
                      </p>
                    )}
                    {
                      aiModelMessage && aiModelMessage.length > 0 && (
                        <AnimatePresence>
                          {aiModelMessage?.map((line, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.1 }}
                              className='border p-4 rounded-md bg-white shadow w-fit text-sm italic text-gray-600'
                            >
                              <p>
                                {line}
                              </p>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      )
                    }
                    {aiModelArticles && aiModelArticles.length > 0 && (
                      <div className='flex flex-col gap-4'>
                        <AnimatePresence>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {aiModelArticles?.map((item: any, idx: number) => (
                            <motion.div
                              key={item.link || idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.1 }}
                              className='border p-4 rounded-md bg-white shadow w-fit'
                            >
                              <h3 className='font-semibold text-lg'>
                                {item.title}
                              </h3>
                              <p className='text-sm text-gray-600 mb-2'>
                                {item.articleType}
                              </p>
                              <p className='mb-2'>{item.content}</p>
                              <a
                                href={item.link}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-blue-500 underline text-sm'
                              >
                                Read more
                              </a>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
        </div>
      )}
      <ChatForm
        className='pt-4'
        handleAction={handleAction}
        isGenerating={isGenerating}
      />
    </div>
  );
}

// "{"type":"status","results":"Analyzing"}{"type":"status","results":" "}{"type":"status","results":"your"}{"type":"status","results":" "}{"type":"status","results":"query..."}{"type":"status","results":"\n"}{"type":"status","results":"Found"}{"type":"status","results":" "}{"type":"status","results":"relevant"}{"type":"status","results":" "}{"type":"status","results":"articles,"}{"type":"status","results":" "}{"type":"status","results":"Preparing"}{"type":"status","results":" "}{"type":"status","results":"articles..."}{"type":"status","results":"\n"}{"type":"articles","results":[{"_id":{"$oid":"68486f004d3182946b80ce6d"},"title":"Trump’s International Student Ban Sparks Fear Among Harvard Attendees","link":"https://www.nytimes.com/2025/06/07/us/trump-harvard-international-student-ban.html","pubDate":{"$date":"2025-06-09T16:16:32Z"},"content":"Alfred Williamson could not have imagined how much his freshman year would be shaped by the Trump administration, inside and outside the classroom.","articleType":"World News","score":0.7212512493133545},{"_id":{"$oid":"68486f004d3182946b80ce79"},"title":"In Trump’s ‘Patriotic’ Hiring Plan, Experts See a Politicized Federal Work Force","link":"https://www.nytimes.com/2025/06/10/us/politics/trumps-politicized-federal-work-force.html","pubDate":{"$date":"2025-06-10T09:02:01Z"},"content":"Political appointments inherently take into consideration loyalty to the president or the party. But expanding those types of questions to the career civil service is a significant departure.","articleType":"U.S. News","score":0.7210296392440796},{"_id":{"$oid":"68486f004d3182946b80ce7b"},"title":"Trump’s Crackdown on LA Protests Contrasts With His Jan. 6 Response","link":"https://www.nytimes.com/2025/06/09/us/trump-la-riots-protests.html","pubDate":{"$date":"2025-06-10T01:20:06Z"},"content":"The president often expresses an open desire for aggressive law enforcement and harsh tactics when protests originate from the political left.","articleType":"U.S. News","score":0.7199058532714844},{"_id":{"$oid":"68486f004d3182946b80ce84"},"title":"Trump Pivots From Musk to Newsom","link":"https://www.nytimes.com/2025/06/09/us/politics/trump-newsom-musk-feud.html","pubDate":{"$date":"2025-06-09T22:02:39Z"},"content":"One constant in President Trump’s second term is that the subjects of his quarrels are ever-changing.","articleType":"U.S. News","score":0.717564046382904},{"_id":{"$oid":"68486f004d3182946b80ce4a"},"title":"Tuesday Briefing","link":"https://www.nytimes.com/2025/06/10/briefing/california-trump-gaza-ukraine.html","pubDate":{"$date":"2025-06-10T16:13:45Z"},"content":"A lawsuit between California and President Trump.","articleType":"World News","score":0.716423511505127}]}"
