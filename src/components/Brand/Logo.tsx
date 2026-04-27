"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import { LuLink } from "react-icons/lu";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "svg" | "image" | "auto";
  forceColor?: "light" | "dark";
}

const SIZE_MAP = {
  sm: { width: 24, height: 24 },
  md: { width: 32, height: 32 },
  lg: { width: 48, height: 48 },
};

export function Logo({ className = "", size = "md", variant = "svg", forceColor }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const dimensions = SIZE_MAP[size];
  
  const isDark = forceColor === "dark" || (forceColor === undefined && resolvedTheme === "dark");

  if (variant === "image" || (variant === "auto" && isDark)) {
    return (
      <Image
        src="/brand/anonhost-fill.png"
        alt="AnonHost"
        width={dimensions.width}
        height={dimensions.height}
        className={className}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={dimensions.height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14 18a2 2 0 0 0-4 0" />
      <path d="m19 11-2.11-6.657a2 2 0 0 0-2.752-1.148l-1.276.61A2 2 0 0 1 12 4H8.5a2 2 0 0 0-1.925 1.456L5 11" />
      <path d="M2 11h20" />
      <circle cx="17" cy="18" r="3" />
      <circle cx="7" cy="18" r="3" />
    </svg>
  );
}

export function LogoLink({ className = "", size = "md" }: LogoProps) {
  return (
    <Logo className={className} size={size} />
  );
}

interface LogoTextProps {
  className?: string;
  showText?: boolean;
}

export function LogoText({ className = "", showText = true }: LogoTextProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo variant="svg" size="md" />
      {showText && (
        <span className="text-lg font-bold">AnonHost</span>
      )}
    </div>
  );
}

export function LogoIcon({ className = "" }: { className?: string }) {
  return (
    <LuLink className={className} />
  );
}