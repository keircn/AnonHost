"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Settings } from "@/lib/settings";

interface DirectLinksSettingsProps {
  settings: Settings;
  onFieldChange: (field: keyof Settings, value: Settings[keyof Settings]) => void;
}

export function DirectLinksSettings({ settings, onFieldChange }: DirectLinksSettingsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="direct-links">Direct Links</Label>
        <p className="text-muted-foreground text-sm">Enable direct links to your images</p>
      </div>
      <Switch
        id="direct-links"
        checked={settings.enableDirectLinks}
        onCheckedChange={(checked) => onFieldChange("enableDirectLinks", checked)}
      />
    </div>
  );
}
