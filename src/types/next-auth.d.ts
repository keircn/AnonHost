import "next-auth";
import { AdapterUser } from "@auth/core/adapters";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string | null;
      name: string | null;
      image: string | null;
      admin: boolean;
      premium: boolean;
    };
  }

  interface User extends AdapterUser {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
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