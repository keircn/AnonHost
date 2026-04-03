"use client";

import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Settings } from "@/lib/settings";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

interface ImagePrivacySettingsProps {
  settings: Settings;
  onFieldChange: (field: keyof Settings, value: Settings[keyof Settings]) => void;
}

export function ImagePrivacySettings({ settings, onFieldChange }: ImagePrivacySettingsProps) {
  return (
    <motion.div className="flex items-center justify-between" variants={fadeIn}>
      <div className="space-y-0.5">
        <Label htmlFor="make-images-public">Default Upload Visibility</Label>
        <p className="text-muted-foreground text-sm">Make new uploads public by default</p>
      </div>
      <Switch
        id="make-images-public"
        checked={settings.makeImagesPublic}
        onCheckedChange={(checked) => onFieldChange("makeImagesPublic", checked)}
      />
    </motion.div>
  );
}
