import "next-auth";
import { AdapterUser } from "@auth/core/adapters";

declare module "next-auth" {
  interface Session {
    user: User & {
      id: string
      uid: number
      email: string
      name: string
      premium: boolean
      createdAt: string
      admin: boolean
    };
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

declare module "@auth/core/adapters" {
  interface AdapterUser {
    id: string;
    admin: boolean;
    premium: boolean;
  }
}
