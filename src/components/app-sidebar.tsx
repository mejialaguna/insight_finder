'use client';

import { GalleryVerticalEnd, Plus } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useMemo } from 'react';

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
  id: string;
  title: string;
  createdAt: Date;
}

interface User {
  name:   string;
  email:  string;
  id:     string;
  avatar: string;
}

interface AppData {
  user: User;
  conversations?: Conversation[];
}

export function AppSidebar({
  conversations,
  conversationId,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  conversations?: Conversation[];
  conversationId?: string;
  user: User;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { setShouldShowNewConversation } = useNewConversationFeature();
  const { state, setOpen } = useSidebar();
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const userData: AppData = useMemo(
    () => ({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      user: user!,
      ...(conversations && { conversations }),
    }),
    [conversations, user]
  );

  const handleAddConversation = useCallback(() => {
    if (conversationId) router.replace(pathname);
    setShouldShowNewConversation(true);
  }, [conversationId, pathname, router, setShouldShowNewConversation]);

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader className='flex flex-row justify-center items-center h-16 border-b'>
        <GalleryVerticalEnd className='h-5 w-5' />
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
        {userData?.conversations && userData?.conversations?.length > 0 && (
          <NavProjects projects={userData.conversations} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
