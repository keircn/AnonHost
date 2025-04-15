"use client";

import { useState, useEffect } from "react";
import {
  type ProfileSettings,
  fetchProfileSettings,
  updateProfileSettings,
} from "@/lib/profile";

interface FormState extends Omit<ProfileSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  title: string;
  description: string;
  avatarUrl: string;
  bannerUrl: string;
  theme: string;
  themeSettings: ProfileSettings['themeSettings'];
  socialLinks: ProfileSettings['socialLinks'];
}

export function useProfileSettings() {
  const [profileSettings, setProfileSettings] = useState<FormState>({
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

  const [originalSettings, setOriginalSettings] = useState<FormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const loadProfileSettings = async () => {
      try {
        setIsLoading(true);
        const data = await fetchProfileSettings();
        const formState: FormState = {
          title: data.title ?? "",
          description: data.description ?? "",
          avatarUrl: data.avatarUrl ?? "",
          bannerUrl: data.bannerUrl ?? "",
          theme: data.theme ?? "default",
          themeSettings: {
            name: data.themeSettings?.name ?? "default",
            cardOpacity: data.themeSettings?.cardOpacity ?? 60,
            blurStrength: data.themeSettings?.blurStrength ?? 5,
            layout: data.themeSettings?.layout ?? "default",
            colorScheme: {
              background: data.themeSettings?.colorScheme?.background ?? "",
              text: data.themeSettings?.colorScheme?.text ?? "",
              accent: data.themeSettings?.colorScheme?.accent ?? "",
            },
            effects: {
              particles: data.themeSettings?.effects?.particles ?? false,
              gradientAnimation: data.themeSettings?.effects?.gradientAnimation ?? false,
              imageParallax: data.themeSettings?.effects?.imageParallax ?? false,
            },
          },
          socialLinks: data.socialLinks ?? [],
        };
        setProfileSettings(formState);
        setOriginalSettings(formState);
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

  useEffect(() => {
    if (!originalSettings) return;

    const hasFieldChanges = (current: any, original: any): boolean => {
      if (current === original) return false;
      if ((current === "" || current === null) && (original === "" || original === null)) return false;
      if (typeof current !== typeof original) return true;
      if (typeof current !== 'object') return current !== original;
      if (Array.isArray(current)) {
        return JSON.stringify(current) !== JSON.stringify(original);
      }
      return JSON.stringify(current) !== JSON.stringify(original);
    };

    const hasChanged = Object.keys(profileSettings).some(key => {
      const field = key as keyof FormState;
      return hasFieldChanges(profileSettings[field], originalSettings[field]);
    });

    setHasChanges(hasChanged);
  }, [profileSettings, originalSettings]);

  const updateProfileField = (
    field: keyof FormState,
    value: any,
  ) => {
    console.log(`Updating ${field}:`, value);
    setProfileSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateThemeSettings = (
    field: string,
    value: string | number | boolean,
  ) => {
    console.log(`Updating theme setting ${field}:`, value);
    setProfileSettings(prev => {
      if (field === "theme") {
        return {
          ...prev,
          theme: value as string,
        };
      }

      const newThemeSettings = { ...prev.themeSettings };

      if (field === "layout") {
        newThemeSettings.layout = value as "default" | "minimal" | "centered" | "grid";
      } else if (field === "cardOpacity" || field === "blurStrength") {
        newThemeSettings[field] = Number(value);
      } else if (["particles", "gradientAnimation", "imageParallax"].includes(field)) {
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
    setProfileSettings(prev => {
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

  const getChangedFields = () => {
    if (!originalSettings) return {};

    const changes: Partial<ProfileSettings> = {};

    // Helper function to check if a field has changed and should be included
    const shouldIncludeField = (field: keyof FormState) => {
      const currentValue = profileSettings[field];
      const originalValue = originalSettings[field];

      // If both are empty (null, undefined, or empty string), don't include
      if (
        (currentValue === "" || currentValue === null || currentValue === undefined) &&
        (originalValue === "" || originalValue === null || originalValue === undefined)
      ) {
        return false;
      }

      // If one is empty and the other is not, that's a change
      if (
        (currentValue === "" || currentValue === null || currentValue === undefined) !==
        (originalValue === "" || originalValue === null || originalValue === undefined)
      ) {
        return true;
      }

      // Otherwise, compare values
      return JSON.stringify(currentValue) !== JSON.stringify(originalValue);
    };

    // Handle string fields
    ['title', 'description', 'avatarUrl', 'bannerUrl', 'theme'].forEach((key) => {
      const field = key as keyof FormState;
      if (shouldIncludeField(field)) {
        (changes as any)[field] = profileSettings[field] || null;
      }
    });

    // Handle themeSettings
    if (shouldIncludeField('themeSettings')) {
      changes.themeSettings = profileSettings.themeSettings;
    }

    // Handle socialLinks
    if (shouldIncludeField('socialLinks')) {
      changes.socialLinks = profileSettings.socialLinks;
    }

    return changes;
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const changedFields = getChangedFields();
      console.log("Changed fields to save:", changedFields);

      if (Object.keys(changedFields).length === 0) {
        console.log("No changes detected");
        return null;
      }

      const updatedProfile = await updateProfileSettings(changedFields);

      // Update both current and original state with the response
      const formState: FormState = {
        title: updatedProfile.title ?? "",
        description: updatedProfile.description ?? "",
        avatarUrl: updatedProfile.avatarUrl ?? "",
        bannerUrl: updatedProfile.bannerUrl ?? "",
        theme: updatedProfile.theme ?? "default",
        themeSettings: updatedProfile.themeSettings,
        socialLinks: updatedProfile.socialLinks,
      };

      setProfileSettings(formState);
      setOriginalSettings(formState);
      setHasChanges(false);
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
    setProfileSettings(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platform: "website", url: "" }],
    }));
  };

  const removeSocialLink = (index: number) => {
    setProfileSettings(prev => ({
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
    hasChanges,
  };
}
