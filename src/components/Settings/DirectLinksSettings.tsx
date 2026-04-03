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

interface DirectLinksSettingsProps {
  settings: Settings;
  onFieldChange: (field: keyof Settings, value: Settings[keyof Settings]) => void;
}

export function DirectLinksSettings({ settings, onFieldChange }: DirectLinksSettingsProps) {
  return (
    <motion.div className="flex items-center justify-between" variants={fadeIn}>
      <div className="space-y-0.5">
        <Label htmlFor="direct-links">Direct Links</Label>
        <p className="text-muted-foreground text-sm">Enable direct links to your images</p>
      </div>
      <Switch
        id="direct-links"
        checked={settings.enableDirectLinks}
        onCheckedChange={(checked) => onFieldChange("enableDirectLinks", checked)}
      />
    </motion.div>
  );
}
