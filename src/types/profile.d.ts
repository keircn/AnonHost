import { Media, Profile, SocialLink } from "@prisma/client";
import { User } from "next-auth";

export interface ProfileThemeSettings {
  [key: string]: unknown;
  name: string;
  cardOpacity: number;
  blurStrength: number;
  layout: "default" | "minimal" | "centered" | "grid";
  colorScheme: {
    background: string;
    text: string;
    accent: string;
  };
  effects?: {
    particles?: boolean;
    gradientAnimation?: boolean;
    imageParallax?: boolean;
  };
}

export interface ProfileUpdateData {
  title?: string | null;
  description?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  theme?: string;
  themeSettings?: {
    cardOpacity?: number;
    blurStrength?: number;
    layout?: string;
    colorScheme?: {
      background?: string;
      text?: string;
      accent?: string;
    };
    effects?: {
      particles?: boolean;
      gradientAnimation?: boolean;
      imageParallax?: boolean;
    };
  };
  socialLinks?: Array<{
    platform: string;
    url: string;
  }>;
}

export interface UserWithProfile extends User {
  id: string;
  uid: number;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  premium: boolean;
  admin: boolean;
  createdAt: Date;
  profile: Profile & {
    title: string | null;
    description: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    socialLinks: SocialLink[];
    themeSettings: ProfileThemeSettings;
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
