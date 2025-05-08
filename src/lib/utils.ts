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

export function deepEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== typeof obj2) return false;

  if (typeof obj1 !== "object") {
    return obj1 === obj2;
  }

  const val1 = obj1 as Record<string, unknown>;
  const val2 = obj2 as Record<string, unknown>;

  if (Array.isArray(val1) !== Array.isArray(val2)) return false;

  const keys1 = Object.keys(val1);
  const keys2 = Object.keys(val2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(val1[key], val2[key])) return false;
  }

  return true;
}
