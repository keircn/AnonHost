"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfileSettings } from "@/hooks/use-profile-settings";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function ProfileThemeSettings() {
  const { data: session } = useSession();
  const { profileSettings, updateThemeSettings } = useProfileSettings();
  const isPremium = session?.user?.premium;

  return (
    <motion.div className="space-y-6" variants={fadeIn}>
      <div className="space-y-2">
        <Label>Theme Customization</Label>
        <Select
          value={profileSettings.theme}
          onValueChange={(value) => updateThemeSettings("theme", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="gradient">Gradient</SelectItem>
            {isPremium && (
              <>
                <SelectItem value="glass">Glass Morphism</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="neon">Neon</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Card Opacity</Label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              value={profileSettings.themeSettings?.cardOpacity ?? 60}
              onChange={(e) => {
                const value = Math.max(
                  0,
                  Math.min(100, Number.parseInt(e.target.value)),
                );
                updateThemeSettings("cardOpacity", value);
              }}
              className="w-full"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-12 text-right">
                {profileSettings.themeSettings?.cardOpacity ?? 60}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateThemeSettings("cardOpacity", 60)}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Background Blur</Label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="20"
              value={profileSettings.themeSettings?.blurStrength ?? 5}
              onChange={(e) =>
                updateThemeSettings(
                  "blurStrength",
                  Number.parseInt(e.target.value),
                )
              }
              className="w-full"
            />
            <span className="text-sm text-muted-foreground w-12 text-right">
              {profileSettings.themeSettings?.blurStrength ?? 5}px
            </span>
          </div>
        </div>

        {isPremium && (
          <>
            <div className="space-y-2">
              <Label>Layout</Label>
              <Select
                value={profileSettings.themeSettings?.layout}
                onValueChange={(value) =>
                  updateThemeSettings(
                    "layout",
                    value as "default" | "minimal" | "centered" | "grid",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="centered">Centered</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Premium Effects</Label>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Particle Effects</Label>
                    <p className="text-sm text-muted-foreground">
                      Add animated particles to the background
                    </p>
                  </div>
                  <Switch
                    checked={profileSettings.themeSettings?.effects?.particles}
                    onCheckedChange={(checked) =>
                      updateThemeSettings("particles", checked)
                    }
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
