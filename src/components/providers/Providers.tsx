'use client';

import { SessionProvider } from 'next-auth/react';

interface SessionProviderProps {
  children: React.ReactNode;
}

export const Providers = ({ children }: SessionProviderProps) => {
  return <SessionProvider>{children}</SessionProvider>;
};
