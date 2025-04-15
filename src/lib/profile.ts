import type { ProfileThemeSettings } from "@/types/profile";

export interface ProfileSettings {
  title: string;
  description: string;
  avatarUrl: string;
  bannerUrl: string;
  theme: string;
  themeSettings: ProfileThemeSettings;
  socialLinks: Array<{ platform: string; url: string; id?: string }>;
}

export async function fetchProfileSettings(): Promise<ProfileSettings> {
  try {
    const response = await fetch("/api/settings/profile");
    if (!response.ok) {
      throw new Error("Failed to fetch profile settings");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching profile settings:", error);
    throw error;
  }
}

export async function updateProfileSettings(
  settings: Partial<ProfileSettings>
): Promise<ProfileSettings> {
  try {
    const sanitizedSettings = {
      ...settings,
      themeSettings: settings.themeSettings ? {
        cardOpacity: Number(settings.themeSettings.cardOpacity) ?? 60,
        blurStrength: Number(settings.themeSettings.blurStrength) ?? 5,
        layout: settings.themeSettings.layout ?? "default",
        colorScheme: {
          background: settings.themeSettings.colorScheme?.background ?? "",
          text: settings.themeSettings.colorScheme?.text ?? "",
          accent: settings.themeSettings.colorScheme?.accent ?? "",
        },
        effects: {
          particles: settings.themeSettings.effects?.particles ?? false,
          gradientAnimation: settings.themeSettings.effects?.gradientAnimation ?? false,
          imageParallax: settings.themeSettings.effects?.imageParallax ?? false,
        },
      } : undefined,
      socialLinks: settings.socialLinks?.map((link) => ({
        platform: link.platform,
        url: link.url,
      })),
    };

    const response = await fetch("/api/settings/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sanitizedSettings),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save profile");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating profile settings:", error);
    throw error;
  }
}

export async function uploadProfileMedia(
  file: File,
  type: "avatar" | "banner",
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  const response = await fetch("/api/media", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload ${type}`);
  }

  const data = await response.json();
  return data.url;
}
