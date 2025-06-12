import bcrypt from 'bcryptjs';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { nextAuthEdgeConfig } from './auth-edge';
import { authSchema } from './content-types';
import { getUserByEmail } from './server-utils';

const config = {
  ...nextAuthEdgeConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        // runs on login

        // validation
        const validatedFormData = authSchema.safeParse(credentials);
        if (!validatedFormData.success) {
          return null;
        }

        // extract values
        const { email, password } = validatedFormData.data;

        const { ok, user } = await getUserByEmail(email.toLowerCase());

        if (!user || !ok) {
          // eslint-disable-next-line no-console
          console.log('No user found');
          return null;
        }
        
        const passwordsMatch = await bcrypt.compare(
          password,
          user.password
        );
        if (!passwordsMatch) {
          // eslint-disable-next-line no-console
          console.log('Invalid credentials');
          return null;
        }

        return user;
      },
    }),
  ],
} satisfies NextAuthConfig;

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth(config);
