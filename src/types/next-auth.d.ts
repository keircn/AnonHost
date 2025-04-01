import "next-auth";
import { AdapterUser } from "@auth/core/adapters";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      admin: boolean;
      premium: boolean;
    };
  }

  interface User extends AdapterUser {
    id: number;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    admin: boolean;
    premium: boolean;
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    admin: boolean;
    premium: boolean;
  }
}
