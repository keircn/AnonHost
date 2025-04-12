"use client";

import { useState, useEffect } from "react";
import {
  type ProfileSettings,
  fetchProfileSettings,
  updateProfileSettings,
} from "@/lib/profile";

export function useProfileSettings() {
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    title: "",
    description: "",
    avatarUrl: "",
    bannerUrl: "",
    theme: "default",
    themeSettings: {
      name: "default",
      cardOpacity: 60,
      blurStrength: 5,
      layout: "default",
      colorScheme: {
        background: "",
        text: "",
        accent: "",
      },
      effects: {
        particles: false,
        gradientAnimation: false,
        imageParallax: false,
      },
    },
    socialLinks: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadProfileSettings = async () => {
      try {
        setIsLoading(true);
        const data = await fetchProfileSettings();
        setProfileSettings(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to load profile settings"),
        );
        console.error("Failed to load profile settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileSettings();
  }, []);

  const updateProfileField = (
    field: keyof ProfileSettings,
    value: string | number | boolean | object,
  ) => {
    console.log(`Updating ${field}:`, value);
    setProfileSettings((prev) => {
      const newState = { ...prev, [field]: value };
      console.log("New state after update:", newState);
      return newState;
    });
  };

  const updateThemeSettings = (
    field: string,
    value: string | number | boolean,
  ) => {
    console.log(`Updating theme setting ${field}:`, value);
    setProfileSettings((prev) => {
      if (field === "theme") {
        return {
          ...prev,
          theme: value as string,
        };
      }

      const newThemeSettings = { ...prev.themeSettings };

      if (field === "layout") {
        newThemeSettings.layout = value as
          | "default"
          | "minimal"
          | "centered"
          | "grid";
      } else if (field === "cardOpacity" || field === "blurStrength") {
        newThemeSettings[field] = Number(value);
      } else if (
        ["particles", "gradientAnimation", "imageParallax"].includes(field)
      ) {
        newThemeSettings.effects = {
          ...newThemeSettings.effects,
          [field]: Boolean(value),
        };
      }

      return {
        ...prev,
        themeSettings: newThemeSettings,
      };
    });
  };

  const updateSocialLinks = (index: number, field: string, value: string) => {
    console.log(`Updating social link ${index} ${field}:`, value); // Debug log
    setProfileSettings((prev) => {
      const newLinks = [...prev.socialLinks];
      newLinks[index] = {
        ...newLinks[index],
        [field]: value,
      };
      return {
        ...prev,
        socialLinks: newLinks,
      };
    });
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      console.log("Saving profile settings:", profileSettings);
      const updatedProfile = await updateProfileSettings(profileSettings);
      setProfileSettings(updatedProfile);
      setError(null);
      return updatedProfile;
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to save profile settings"),
      );
      console.error("Failed to save profile settings:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const addSocialLink = () => {
    setProfileSettings((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platform: "website", url: "" }],
    }));
  };

  const removeSocialLink = (index: number) => {
    setProfileSettings((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  };

  return {
    profileSettings,
    updateProfileField,
    updateThemeSettings,
    updateSocialLinks,
    addSocialLink,
    removeSocialLink,
    saveProfile,
    isLoading,
    isSaving,
    error,
  };
}
