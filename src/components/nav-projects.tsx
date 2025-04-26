'use client';

import {
  MoreHorizontal,
  Trash2,
  Volleyball,
  Plane,
  Newspaper,
  Search,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';

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

const typeToIcon: Record<string, LucideIcon> = {
  food: Utensils,
  sports: Volleyball,
  travel: Plane,
  general: Newspaper,
  default: Search,
};

export function NavProjects({
  projects,
}: {
  projects: {
    name: string;
    time: string;
    type: string;
  }[];
}) {
  const { isMobile } = useSidebar();
  const [isOpen, setIsOpen] = useState(true);
  const pathName = usePathname();
  const searchParams = useSearchParams();

  const createPageUrl = (conversationId: number | string) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set('conversationId', conversationId.toString());
    return `${pathName}?${params.toString()}`;
  };

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
            {projects.map((item, idx) => {
              const normalizedType = item.type?.toLowerCase() ?? 'default';
              const Icon = typeToIcon[normalizedType] ?? typeToIcon.default;

              return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton tooltip={item.name}>
                    <Icon className="w-4 h-4" />
                    <Link href={createPageUrl(`${idx}-${item.name}`)}>
                      {item.name}
                    </Link>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-48 rounded-lg"
                      side={isMobile ? 'bottom' : 'right'}
                      align={isMobile ? 'end' : 'start'}
                    >
                      <DropdownMenuItem>
                        <Trash2 className="text-muted-foreground" />
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
