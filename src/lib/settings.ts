export interface Settings {
  enableNotifications: boolean;
  enableDirectLinks: boolean;
  customDomain: string;
  makeImagesPublic?: boolean;
}

export async function fetchSettings(): Promise<Settings> {
  try {
    const response = await fetch("/api/settings");
    if (!response.ok) {
      throw new Error("Failed to fetch settings");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching settings:", error);
    throw error;
  }
}

export async function updateSettings(settings: Settings): Promise<Settings> {
  try {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error("Failed to update settings");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating settings:", error);
    throw error;
  }
}

export async function changeEmail(newEmail: string): Promise<void> {
  const response = await fetch("/api/settings/email", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: newEmail }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to update email");
  }
}
