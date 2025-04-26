'use client';
import { useNewConversationFeature } from '@/store';

import { ChatForm } from './chat-form';
import { ChatInterface } from './chat-interface';

interface FeatureAreaProp {
  conversationId?: string;
}
export default function FeatureArea({ conversationId }: FeatureAreaProp) {
  const { shouldShowNewConversation } = useNewConversationFeature();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {shouldShowNewConversation && !conversationId ? (
        <ChatInterface />
      ) : (
        <>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
          <div className="min-h-[100vh] flex flex-1 rounded-xl bg-muted/50 md:min-h-min flex-col" >
          {/* <Articles /> */}
          <h1>Hello</h1>
          <ChatForm className='p-4'/>
          </div>
        </>
      )}
    </div>
  );
}
