'use client';
import { useNewConversationFeature } from '@/store';

import { ArticleList } from './article-list';
import { ChatForm } from './chat-form';
import { ChatInterface } from './chat-interface';

interface FeatureAreaProp {
  conversationId?: string;
  articles: any;
}

export default function FeatureArea({ conversationId, articles }: FeatureAreaProp) {
  const { shouldShowNewConversation } = useNewConversationFeature();

  return (
    <div className="flex flex-col h-[92vh] gap-4 px-4 pt-4"> {/* h-screen to lock it to the viewport height */}
      {shouldShowNewConversation && !conversationId ? (
        <ChatInterface />
      ) : (
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          {/* Top: Chat Section */}
          <div className="flex-1 rounded-xl bg-muted/50 p-4 overflow-auto">
            <h1>chat goes here</h1>
          </div>

          {/* Bottom: ArticleList + ChatForm Section */}
          <div className="flex-1 flex flex-col rounded-xl bg-muted/50 p-4 overflow-hidden">
            {/* Scrollable article list */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <ArticleList articles={articles} />
            </div>

            {/* ChatForm stays pinned at bottom */}
            <ChatForm className="pt-4" />
          </div>
        </div>
      )}
    </div>
  );
}
