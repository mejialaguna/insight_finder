'use client';

import { GalleryVerticalEnd, Plus } from 'lucide-react';
import * as React from 'react';

import { NavProjects } from '@/components/nav-projects';
import { NavUser } from '@/components/nav-user';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

import { CollapsedTooltip } from './collapsed-tooltip';
import { SearchForm } from './search-form';
import { useNewConversationFeature } from '@/store';

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setShouldShowNewConversation } = useNewConversationFeature();
  const { state, setOpen } = useSidebar();
  const [data, setData] = React.useState<AppData>(initialData);

  const handleAddConversation = () => {
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
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader className='items-center h-16 dimelo border-b'>
        <div className='flex items-center px-4 py-2 gap-2'>
          <GalleryVerticalEnd className='h-5 w-5' />
          {state !== 'collapsed' && (
            <span
              className={cn(
                'text-lg font-semibold transition-opacity duration-200'
              )}
            >
              Insight Finder
            </span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <CollapsedTooltip
          tooltip='New Conversation'
          isCollapsed={state === 'collapsed'}
        >
          <Button
            variant='outline'
            size='sm'
            className='flex items-center gap-2 mx-2 mt-4'
            onClick={handleAddConversation}
          >
            <Plus className='h-4 w-4' />
            {state !== 'collapsed' && 'New Conversation'}
          </Button>
        </CollapsedTooltip>
        <CollapsedTooltip
          tooltip='search previous topics'
          isCollapsed={state === 'collapsed'}
        >
          <SearchForm
            isCollapsed={state === 'collapsed'}
            className='pt-2.5'
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
