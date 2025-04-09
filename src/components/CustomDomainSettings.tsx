"use client";

import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/hooks/use-settings";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function CustomDomainSettings() {
  const { settings, updateSettingsField } = useSettings();

  return (
    <motion.div className="space-y-2" variants={fadeIn}>
      <Label htmlFor="custom-domain">Custom Domain</Label>
      <p className="text-sm text-muted-foreground mb-2">
        Use your own domain for image URLs (requires DNS setup)
      </p>
      <Input
        id="custom-domain"
        placeholder="images.yourdomain.com"
        value={settings.customDomain || ""}
        onChange={(e) => updateSettingsField("customDomain", e.target.value)}
      />
    </motion.div>
  );
}
