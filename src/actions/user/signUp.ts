'use server';

import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { signUpSchema } from '@/lib/content-types';
import prisma from '@/lib/prisma';

// eslint-disable-next-line no-duplicate-imports
import { logIn } from './login';

// eslint-disable-next-line no-duplicate-imports
import type { TAuthSignUp } from '@/lib/content-types';

interface AuthenticationResult {
  ok: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export const signUpUser = async ({
  name,
  email,
  password,
  confirmPassword,
}: TAuthSignUp): Promise<AuthenticationResult> => {
  const { success, data } = signUpSchema.safeParse({
    name,
    email,
    password,
    confirmPassword,
  });
  
  if (!success) return { ok: false, message: 'Invalid user data' };
  const {
    name: parsedName,
    email: parsedEmail,
    password: parsedPassword,
  } = data;

  try {
    const user = await prisma.user.create({
      data: {
        name: parsedName,
        email: parsedEmail.toLowerCase(),
        password: bcrypt.hashSync(parsedPassword),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const loginResult = await logIn({ email, password });

    if (!loginResult.ok) {
      return {
        ok: false,
        message: loginResult.message || 'Login failed after signup',
      };
    }

    return {
      ok: true,
      user,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return {
          ok: false,
          message: `Email ${data.email} already exists`,
        };
      }
    }
    return {
      ok: false,
      message: `something went wrong creating user, ${error}`,
    };
  }
};
