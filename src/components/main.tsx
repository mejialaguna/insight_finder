import {
  getConversationMessages,
  getConversations,
} from '@/actions/conversation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import FeatureArea from './feature-area';
import Header from './header';

import type { Message } from '@prisma/client';
interface MainPageProp {
  conversationId?: string;
}

export default async function Main({ conversationId }: MainPageProp) {
  const isLoggedIn = true;
  let messages: Message[] = [];

  if (!isLoggedIn) {
    return <div>Please login to continue</div>;
  }

  const { conversations } = await getConversations('mejialaguna@gmail.com');

  if (conversationId) {
    const response = await getConversationMessages(conversationId);

    if (response.ok && response.messages && response?.messages?.length > 0) {
      messages = response.messages;

    }
  }

  return (
    <SidebarProvider>
      <AppSidebar
        conversations={conversations}
        conversationId={conversationId}
      />
      <SidebarInset>
        <Header />
        <FeatureArea
          key={conversationId}
          conversationId={conversationId}
          {...(messages.length > 0 && { messages })}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
