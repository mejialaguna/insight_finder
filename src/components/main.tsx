import {
  getConversationMessages,
  getConversations,
} from '@/actions/conversation';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import FeatureArea from './feature-area';
import Header from './header';
import { checkAuth } from '../lib/server-utils';

import type { Message } from '@prisma/client';
interface MainPageProp {
  conversationId?: string;
}

export default async function Main({ conversationId }: MainPageProp) {
  const session = await checkAuth();
  const user = {
    id: session.user.id,
    name: session.user.name || '',
    email: session.user.email || '',
    avatar: session.user.avatar || '',
  };
  let messages: Message[] = [];

  const { conversations } = await getConversations(user.email);

  if (conversationId) {
    const response = await getConversationMessages(conversationId);

    if (response.ok && response.messages && response?.messages?.length > 0) {
      messages = response.messages;
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar
        key={conversationId}
        conversations={conversations}
        conversationId={conversationId}
        user={user}
      />
      <SidebarInset>
        <Header  conversationId={conversationId} />
        <FeatureArea
          key={conversationId}
          conversationId={conversationId}
          {...(messages.length > 0 && { messages })}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
