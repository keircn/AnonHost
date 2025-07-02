"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { NotificationSettings } from "@/components/NotificationSettings";
import { DirectLinksSettings } from "@/components/DirectLinksSettings";
import { EmailChangeSection } from "@/components/EmailChangeSection";
// import { CustomDomainSettings } from "@/components/CustomDomainSettings";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

export function GeneralSettingsTab() {
  const { toast } = useToast();
  const { updateSettings, isLoading } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateSettings();
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate">
      <Card>
        <CardHeader>
          <motion.div variants={fadeIn}>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Manage your account preferences and settings
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div className="space-y-4" variants={staggerContainer}>
            <NotificationSettings />
            <DirectLinksSettings />
            <EmailChangeSection />
          </motion.div>

          <motion.div className="flex justify-end" variants={fadeIn}>
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
