import 'server-only';

import { redirect } from 'next/navigation';

import { auth } from './auth-no-edge';
import prisma from './prisma';
import { getErrorMessage, validateRequiredFields } from './utils';

import type { User } from '@prisma/client';

export async function checkAuth() {
  const session = await auth();
  if (!session?.user || !session?.user?.id) {
    redirect('/login');
  }

  return session;
}

export async function getUserByEmail(userEmail: User['email']) {
  const error = validateRequiredFields({ userEmail });
  if (error) {
    return { ok: false, error };
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
    });
    return { ok: true, user };
  } catch (error) {
    return { ok: false, error: `getUser: ${getErrorMessage(error)}` };
  }
}
