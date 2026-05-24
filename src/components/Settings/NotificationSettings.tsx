"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Settings } from "@/lib/settings";

interface NotificationSettingsProps {
  settings: Settings;
  onFieldChange: (field: keyof Settings, value: Settings[keyof Settings]) => void;
}

export function NotificationSettings({ settings, onFieldChange }: NotificationSettingsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="notifications">Email Notifications</Label>
        <p className="text-muted-foreground text-sm">
          Receive email notifications about your account activity
        </p>
      </div>
      <Switch
        id="notifications"
        checked={settings.enableNotifications}
        onCheckedChange={(checked) => onFieldChange("enableNotifications", checked)}
      />
    </div>
  );
}
