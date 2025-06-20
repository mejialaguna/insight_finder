import { Separator } from '@radix-ui/react-separator';

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from './ui/breadcrumb';
import { SidebarTrigger } from './ui/sidebar';

export default function Header({ conversationId }: { conversationId?: string }) {
  return (
    <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
      <SidebarTrigger className='-ml-1' />
      <Separator orientation='vertical' className='mr-2 h-4' />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className='hidden md:block'>
            Search your article
          </BreadcrumbItem>
          <BreadcrumbSeparator className='hidden md:block' />
          <BreadcrumbItem>
            <BreadcrumbPage>{conversationId ?? 'New conversation'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
