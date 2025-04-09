import type { ApiKey } from "@/types/settings";

export async function fetchApiKeys(): Promise<ApiKey[]> {
  try {
    const response = await fetch("/api/keys");
    if (!response.ok) {
      throw new Error("Failed to fetch API keys");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching API keys:", error);
    throw error;
  }
}

export async function createApiKey(name: string): Promise<ApiKey> {
  try {
    const response = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error("Failed to create API key");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating API key:", error);
    throw error;
  }
}

export async function deleteApiKey(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/keys/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete API key");
    }
  } catch (error) {
    console.error("Error deleting API key:", error);
    throw error;
  }
}
