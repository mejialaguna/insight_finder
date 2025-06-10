'use server';

import { signOut } from '@/lib/auth-no-edge';

export async function logOut() {
  await signOut({ redirectTo: '/' });
}
