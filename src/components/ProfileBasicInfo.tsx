"use client";

import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProfileSettings } from "@/hooks/use-profile-settings";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function ProfileBasicInfo() {
  const { profileSettings, updateProfileField } = useProfileSettings();

  return (
    <motion.div className="space-y-4" variants={fadeIn}>
      <div className="space-y-2">
        <Label htmlFor="profile-title">Profile Title</Label>
        <Input
          id="profile-title"
          placeholder="Your display name"
          value={profileSettings?.title ?? ""}
          onChange={(e) => updateProfileField("title", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-description">Description</Label>
        <Textarea
          id="profile-description"
          placeholder="Tell others about yourself"
          value={profileSettings?.description ?? ""}
          onChange={(e) => updateProfileField("description", e.target.value)}
          rows={4}
        />
      </div>
    </motion.div>
  );
}