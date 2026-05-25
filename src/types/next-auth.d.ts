import 'next-auth';
import { AdapterUser } from '@auth/core/adapters';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      premium?: boolean;
      admin?: boolean;
    } & DefaultSession['user'];
  }

  interface User extends AdapterUser {
    id: string;
    uid: number;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    createdAt: string;
    admin: boolean;
    premium: boolean;
  }
}

declare module '@auth/core/adapters' {
  interface AdapterUser {
    id: string;
    admin: boolean;
    premium: boolean;
  }
}
