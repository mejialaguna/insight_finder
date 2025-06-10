import type { NextAuthConfig } from 'next-auth';

export const nextAuthEdgeConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: ({ auth, request }) => {
      // runs on every request with middleware
      const isLoggedIn = Boolean(auth?.user);
      const path = request.nextUrl.pathname;

      const isTryingToAccessApp = path === '/';
      const loginPage = path === '/login';
      const signupPage = path === '/signup';
      const isPublicPage = loginPage || signupPage;

      if (!isPublicPage && !isLoggedIn) {
        return Response.redirect(new URL('/login', request.nextUrl));
      }

      if (isLoggedIn && isTryingToAccessApp) {
        return true;
      }

      if (isLoggedIn && isPublicPage) {
        return Response.redirect(new URL('/', request.nextUrl));
      }

      // Otherwise (like public pages) allow
      return true;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        // on sign in - include all user data including avatar
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        token.userId = user.id!;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        token.email = user.email!;
        // Add avatar information to the token
        token.avatar = user.avatar;
        // You can also add other user properties if needed
        token.name = user.name;
      }

      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.userId as string;
      session.user.email = token.email as string;
      session.user.avatar = token.avatar as string;
      session.user.name = token.name as string;

      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
