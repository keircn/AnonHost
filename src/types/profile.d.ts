import { Media, Profile, SocialLink } from "@prisma/client";
import { User } from "next-auth";

export interface UserWithProfile extends User {
  id: string;
  uid: number;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  premium: boolean;
  admin: boolean;
  createdAt: string;
  profile: Profile & {
    title: string | null;
    description: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    socialLinks: SocialLink[];
  };
  Media?: Media[];
}

export interface Badge {
  emoji: string;
  label: string;
  color?: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  profileId: string;
}
