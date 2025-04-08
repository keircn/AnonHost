"use client";

import { useEffect } from "react";
import { useNavbar } from "@/components/NavbarContext";
import { ProfileContent } from "@/components/ProfileContent";
import { UserWithProfile } from "@/types/profile";

interface ProfileContainerProps {
  user: UserWithProfile;
  badges: Array<{ label: string; emoji: string }>;
  theme: string;
}

export function ProfileContainer({
  user,
  badges,
  theme,
}: ProfileContainerProps) {
  const { setShowNavbar } = useNavbar();

  useEffect(() => {
    setShowNavbar(false);
    return () => setShowNavbar(true);
  }, [setShowNavbar]);

  return <ProfileContent user={user} badges={badges} theme={theme} />;
}
