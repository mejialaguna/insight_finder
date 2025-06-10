import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      avatar?: string;
    } & DefaultSession['user'];
  }

  interface User {
    avatar?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    email: string;
    avatar?: string;
    name?: string;
  }
}
