"use client";

import { useEffect } from "react";
import { useNavbar } from "@/components/NavbarContext";
import { ProfileContent } from "@/components/ProfileContent";
import { UserProfile } from "@/types/profile";

interface ProfileContainerProps {
  user: UserProfile;
  badges: Array<{ label: string; emoji: string }>;
}

export function ProfileContainer({
  user,
  badges,
}: ProfileContainerProps) {
  const { setShowNavbar } = useNavbar();

  useEffect(() => {
    setShowNavbar(false);
    return () => setShowNavbar(true);
  }, [setShowNavbar]);

  return <ProfileContent user={user} badges={badges} />;
}
