import { useState } from "react";
import { Settings } from "@/types/settings";
import { useToast } from "@/hooks/use-toast";

export const useSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>({
    enableNotifications: true,
    enableDirectLinks: true,
    customDomain: "",
  });

  const updateSettings = async () => {
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error();

      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save settings: ${error}`,
        variant: "destructive",
      });
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings({
          enableNotifications: data.enableNotifications,
          enableDirectLinks: data.enableDirectLinks,
          customDomain: data.customDomain || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  return { settings, setSettings, updateSettings, fetchSettings };
};
