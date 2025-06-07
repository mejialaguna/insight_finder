'use server';

import { AuthError } from 'next-auth';

import { signIn } from '@/lib/auth-no-edge';
import { authSchema, type TAuthSignIn } from '@/lib/content-types';

interface AuthenticationResult {
  ok: boolean;
  message?: string;
}

export async function authenticate(
  formData: TAuthSignIn
): Promise<AuthenticationResult> {

  const { success, data } = authSchema.safeParse({ ...formData });

  if (!success) return { ok: false, message: 'Invalid user data' };

  try {
    await signIn('credentials', {
      ...data,
      redirect: false,
    });

    return { ok: true };

  } catch (error) {
    return {
      ok: false,
      message: 'Wrong email or password',
    };
  }
}

export async function logIn({email, password}: TAuthSignIn) {
  const { success, data } = authSchema.safeParse({
    email,
    password,
  });

  if (!success) return { ok: false, message: 'Invalid user data' };

  try {
    await signIn('credentials', {
      ...data,
      redirect: false,
    });

    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin': {
          return {
            message: 'Invalid credentials.',
          };
        }
        default: {
          return {
            message: 'Error. Could not sign in.',
          };
        }
      }
    }

    throw error; // nextjs redirects throws error, so we need to rethrow it
  }
}
