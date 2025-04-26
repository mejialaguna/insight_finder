'use client';

import { GalleryVerticalEnd, Plus } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { NavProjects } from '@/components/nav-projects';
import { NavUser } from '@/components/nav-user';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useNewConversationFeature } from '@/store';

import { CollapsedTooltip } from './collapsed-tooltip';
import { SearchForm } from './search-form';

// Define the conversation type for better type safety
interface Conversation {
  name: string;
  time: string;
  type: string;
}

interface AppData {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  conversations: Conversation[];
}

// Initial data
const initialData: AppData = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  conversations: [
    {
      name: 'eagles super bowl',
      time: 'today',
      type: 'sports',
    },
    {
      name: 'best ice cream in philly',
      time: 'today',
      type: 'food',
    },
    {
      name: 'best place to eat in philly',
      time: 'today',
      type: 'travel',
    },
  ],
};

export function AppSidebar({
  conversationId,
  ...props
}: React.ComponentProps<typeof Sidebar> & { conversationId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setShouldShowNewConversation } = useNewConversationFeature();
  const { state, setOpen } = useSidebar();
  const [data, setData] = React.useState<AppData>(initialData);

  const handleAddConversation = () => {
    if (conversationId) router.replace(pathname);

    const newConversation: Conversation = {
      name: `New Conversation ${data.conversations.length + 1}`,
      time: 'today',
      type: 'general',
    };

    setData((prev) => ({
      ...prev,
      conversations: [newConversation, ...prev.conversations],
    }));
    setShouldShowNewConversation(true);
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-row justify-center items-center h-16 border-b">
        <GalleryVerticalEnd className="h-5 w-5" />
        <span
          className={cn(
            `text-lg font-semibold transition-opacity duration-200 ${state !== 'collapsed' ? 'inline-flex' : 'hidden'}`
          )}
        >
          Insight Finder
        </span>
      </SidebarHeader>
      <SidebarContent>
        <CollapsedTooltip
          tooltip="New Conversation"
          isCollapsed={state === 'collapsed'}
        >
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 mx-2 mt-4"
            onClick={handleAddConversation}
          >
            <Plus className="h-4 w-4" />
            {state !== 'collapsed' && 'New Conversation'}
          </Button>
        </CollapsedTooltip>
        <CollapsedTooltip
          tooltip="search previous topics"
          isCollapsed={state === 'collapsed'}
        >
          <SearchForm
            isCollapsed={state === 'collapsed'}
            className="pt-2.5"
            setOpen={setOpen}
          />
        </CollapsedTooltip>

        <NavProjects projects={data.conversations} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
