import { Search } from 'lucide-react';

import { Label } from '@/components/ui/label';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
} from '@/components/ui/sidebar';

interface SearchFormProps extends React.ComponentProps<'form'> {
  isCollapsed?: boolean;
  // eslint-disable-next-line no-unused-vars
  setOpen?: (value: boolean) => void;
}

export function SearchForm({ isCollapsed, setOpen, ...props }: SearchFormProps) {
  
  return (
    <form {...props}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          {isCollapsed ? (
            <Search className="mx-auto size-5 text-muted-foreground" onClick={() => setOpen?.(true)}/>
          ) : (
            <>
              <Label htmlFor="search" className="sr-only">
                Search
              </Label>
              <SidebarInput
                id="search"
                placeholder="Search the docs..."
                className="pl-8"
              />
              <Search
                className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none"
              />
            </>
          )}
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  );
}
