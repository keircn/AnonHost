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

export function ProfileBannerUpload() {
  const { toast } = useToast();
  const { profileSettings, updateProfileField } = useProfileSettings();

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const url = await uploadProfileMedia(file, "banner");
      updateProfileField("bannerUrl", url);

      toast({
        title: "Banner updated",
        description: "Your profile banner has been updated successfully",
      });
    } catch (error) {
      console.error("Failed to upload banner:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your banner",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div className="space-y-2" variants={fadeIn}>
      <Label>Profile Banner</Label>
      <div className="relative aspect-[3/1] rounded-lg overflow-hidden bg-muted">
        {profileSettings.bannerUrl ? (
          <Image
            src={profileSettings.bannerUrl || "/placeholder.svg"}
            alt="Banner preview"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-900 to-gray-800" />
        )}
        <Button
          variant="secondary"
          className="absolute bottom-2 right-2"
          onClick={() => document.getElementById("banner-upload")?.click()}
        >
          Change Banner
        </Button>
        <input
          type="file"
          id="banner-upload"
          className="hidden"
          accept="image/*"
          onChange={handleBannerUpload}
        />
      </div>
    </motion.div>
  );
}
