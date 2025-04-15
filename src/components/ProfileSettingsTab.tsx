"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FaExternalLinkAlt } from "react-icons/fa";
import { Card } from "@/components/ui/card";
import { useProfileSettings } from "@/hooks/use-profile-settings";
import { ProfileBasicInfo } from "@/components/ProfileBasicInfo";
import { ProfileAvatarUpload } from "@/components/ProfileAvatarUpload";
import { ProfileBannerUpload } from "@/components/ProfileBannerUpload";
import { ProfileThemeSettings } from "@/components/ProfileThemeSettings";
import { ProfileSocialLinks } from "@/components/ProfileSocialLinks";
import { useToast } from "@/hooks/use-toast";
import type { UserWithProfile } from "@/types/profile";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function ProfileSettingsTab() {
  const { data: session } = useSession();
  const { saveProfile, isSaving, hasChanges } = useProfileSettings();
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      await saveProfile();
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile settings",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div className="space-y-2" variants={fadeIn}>
      <Label>Public Profile</Label>
      <p className="text-sm text-muted-foreground mb-4">
        Customize your public profile page that others can view
      </p>

      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => window.open(`/p/${(session?.user as UserWithProfile)?.uid}`, "_blank")}
      >
        <FaExternalLinkAlt className="h-4 w-4" />
        View Profile
      </Button>

      <Card className="p-6">
        <div className="space-y-6">
          <ProfileBasicInfo />
          <ProfileAvatarUpload />
          <ProfileBannerUpload />
          <ProfileThemeSettings />
          <ProfileSocialLinks />

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}