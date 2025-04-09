"use client";

import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/use-settings";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function NotificationSettings() {
  const { settings, updateSettingsField } = useSettings();

  return (
    <motion.div className="flex items-center justify-between" variants={fadeIn}>
      <div className="space-y-0.5">
        <Label htmlFor="notifications">Email Notifications</Label>
        <p className="text-sm text-muted-foreground">
          Receive email notifications about your account activity
        </p>
      </div>
      <Switch
        id="notifications"
        checked={settings.enableNotifications}
        onCheckedChange={(checked) =>
          updateSettingsField("enableNotifications", checked)
        }
      />
    </motion.div>
  );
}
