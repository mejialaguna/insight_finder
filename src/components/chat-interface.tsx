import { ChatForm } from './chat-form';

export function ChatInterface() {
  return (
    <div className="p-4 border-t flex flex-col flex-1">
      <div className="flex flex-col items-center justify-center xs:h-[50vh] text-center p-8">
        <h2 className="text-2xl font-bold mb-2">Welcome to InsightFinder</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Ask questions about news in natural language. Our AI will find
          relevant articles and provide insights.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Try asking:</h3>
            <ul className="space-y-2 text-sm">
              <li>&quot;What&apos;s happening with climate change?&quot;</li>
              <li>&quot;Latest tech industry layoffs&quot;</li>
              <li>&quot;Developments in the Middle East&quot;</li>
            </ul>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Features:</h3>
            <ul className="space-y-2 text-sm">
              <li>Semantic search across news articles</li>
              <li>AI-powered summaries and insights</li>
              <li>Save and revisit conversation threads</li>
            </ul>
          </div>
        </div>
      </div>
      <ChatForm />
    </div>
  );
}
