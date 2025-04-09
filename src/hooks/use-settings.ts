"use client";

import { useState, useEffect } from "react";
import { type Settings, fetchSettings, updateSettings } from "@/lib/settings";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({
    enableNotifications: true,
    enableDirectLinks: true,
    customDomain: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const data = await fetchSettings();
        setSettings(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load settings"),
        );
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  interface UpdateSettingsField {
    (field: keyof Settings, value: Settings[keyof Settings]): void;
  }

  const updateSettingsField: UpdateSettingsField = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      const updatedSettings = await updateSettings(settings);
      setSettings(updatedSettings);
      setError(null);
      return updatedSettings;
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to save settings"),
      );
      console.error("Failed to save settings:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    settings,
    updateSettings: saveSettings,
    updateSettingsField,
    isLoading,
    error,
  };
}
