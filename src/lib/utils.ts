import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { betaMembers } from "@/lib/beta";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateOTP(): string {
  return Math.random().toString().slice(2, 8);
}

export function getUserBadges(user: { id?: string; premium?: boolean } | null) {
  const badges: Array<{
    emoji: string;
    label: string;
    color?: string;
  }> = [];

  if (user?.premium) {
    badges.push({
      emoji: "💎",
      label: "Premium",
      color: "#a855f7",
    });
  }

  if (user?.id && betaMembers.includes(user.id)) {
    badges.push({
      emoji: "🧪",
      label: "Beta",
      color: "#3b82f6",
    });
  }

  return badges;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
