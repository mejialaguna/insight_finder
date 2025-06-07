'use client';

import { UserSearch,  MoreHorizontal, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useNewConversationFeature } from '@/store';

export function NavProjects({
  projects,
}: {
  projects: {
    id: string;
    title: string;
    createdAt: Date;
  }[];
}) {
  const { isMobile } = useSidebar();
  const [isOpen, setIsOpen] = useState(true);
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const { setShouldShowNewConversation } = useNewConversationFeature();

  const createPageUrl = useCallback((conversationId: number | string) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set('conversationId', conversationId.toString());
    return `${pathName}?${params.toString()}`;
  }, [pathName, searchParams]);

  return (
    <SidebarGroup>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent
          className={`
            overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out
            opacity-0 data-[state=open]:opacity-100
            data-[state=closed]:max-h-0 data-[state=open]:max-h-96
          `}
        >
          <SidebarMenu>
            {projects.map((item) => {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title}>
                    <UserSearch className='w-4 h-4' />
                    <Link href={createPageUrl(item.id)} onClick={() => setShouldShowNewConversation(false)}>
                      {item.title?.replace(/["]/g, '')}
                    </Link>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal />
                        <span className='sr-only'>More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className='w-48 rounded-lg'
                      side={isMobile ? 'bottom' : 'right'}
                      align={isMobile ? 'end' : 'start'}
                    >
                      <DropdownMenuItem>
                        <Trash2 className='text-muted-foreground' />
                        <span>Delete Project</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}
