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
    setProfileSettings((prev: ProfileSettings) => ({
      ...prev,
      [field]: value,
    }));
  };

  type UpdateThemeSettingsField =
    | "theme"
    | "layout"
    | "cardOpacity"
    | "blurStrength"
    | "particles"
    | "gradientAnimation"
    | "imageParallax";

  const updateThemeSettings = (
    field: UpdateThemeSettingsField,
    value: string | number | boolean,
  ) => {
    setProfileSettings((prev) => {
      if (field === "theme") {
        return {
          ...prev,
          theme: value as string,
        };
      }

      if (field === "layout") {
        return {
          ...prev,
          themeSettings: {
            ...prev.themeSettings,
            layout: value as "default" | "minimal" | "centered" | "grid",
          },
        };
      }

      if (field === "cardOpacity" || field === "blurStrength") {
        return {
          ...prev,
          themeSettings: {
            ...prev.themeSettings,
            [field]: value as number,
          },
        };
      }

      if (
        field === "particles" ||
        field === "gradientAnimation" ||
        field === "imageParallax"
      ) {
        return {
          ...prev,
          themeSettings: {
            ...prev.themeSettings,
            effects: {
              ...prev.themeSettings.effects,
              [field]: value as boolean,
            },
          },
        };
      }

      return prev;
    });
  };

  const updateSocialLinks = (index: number, field: string, value: string) => {
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

  const saveProfile = async () => {
    setIsSaving(true);
    try {
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
