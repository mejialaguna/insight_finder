'use client';

import { Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ChatFormProps {
  className?: React.StyleHTMLAttributes<HTMLImageElement>['className'];
}

export function ChatForm({className}: ChatFormProps) {
  return (
    <form className={cn('flex space-x-2 mt-auto', className)}>
        <Input
          placeholder='Ask about news or search for articles...'
          className='flex-1'
        />
        <Button type='submit' className='bg-blue-500 hover:bg-blue-600 transition-colors duration-300'>
          <Send className='h-4 w-4' />
          <span className='sr-only'>Send</span>
        </Button>
      </form>
  );
}
