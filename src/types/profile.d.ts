import { Media, Profile } from "@prisma/client";

export interface UserWithProfile {
  id: string;
  name: string | null;
  email: string | null;
  premium: boolean;
  profile: Profile | null;
  Media?: Media[];
}

export interface Badge {
  emoji: string;
  label: string;
  color?: string;
}
