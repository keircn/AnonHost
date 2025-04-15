"use client";

import type React from "react";

import { motion } from "framer-motion";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useProfileSettings } from "@/hooks/use-profile-settings";
import { uploadProfileMedia } from "@/lib/profile";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function ProfileAvatarUpload() {
  const { toast } = useToast();
  const { profileSettings, updateProfileField } = useProfileSettings();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = await uploadProfileMedia(file, "avatar");
      if (url) {
        updateProfileField("avatarUrl", url);
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been updated successfully",
        });
      }
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your avatar",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div className="space-y-2" variants={fadeIn}>
      <Label>Profile Picture</Label>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted">
          {profileSettings.avatarUrl ? (
            <Image
              src={profileSettings.avatarUrl || "/placeholder.svg"}
              alt="Avatar preview"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900" />
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => document.getElementById("avatar-upload")?.click()}
        >
          Change Avatar
        </Button>
        <input
          type="file"
          id="avatar-upload"
          className="hidden"
          accept="image/*"
          onChange={handleAvatarUpload}
        />
      </div>
    </motion.div>
  );
}
