"use client";

import { useState, useEffect, useCallback } from "react";
import type { ApiKey } from "@/types/settings";
import {
  fetchApiKeys,
  createApiKey as createKey,
  deleteApiKey as deleteKey,
} from "@/lib/api-keys";
import { toast } from "sonner";
import React from "react";

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadApiKeys = useCallback(async () => {
    try {
      setIsLoading(true);
      const keys = await fetchApiKeys();
      setApiKeys(keys);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load API keys"),
      );
      console.error("Failed to load API keys:", err);
      toast(
        React.createElement(
          React.Fragment,
          null,
          React.createElement("strong", null, "Error"),
          React.createElement("div", null, "Failed to fetch API keys"),
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  const createApiKey = async (name: string) => {
    try {
      setIsLoading(true);
      const newKey = await createKey(name);
      setApiKeys((currentKeys) => [...currentKeys, newKey]);
      await loadApiKeys();
      return newKey;
    } catch (err) {
      console.error("Failed to create API key:", err);
      toast(
        React.createElement(
          React.Fragment,
          null,
          React.createElement("strong", null, "Error"),
          React.createElement("div", null, "Failed to create API key"),
        ),
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteKey(id);
      setApiKeys((currentKeys) => currentKeys.filter((key) => key.id !== id));
      await loadApiKeys();
      toast(
        React.createElement(
          React.Fragment,
          null,
          React.createElement("strong", null, "API key deleted"),
          React.createElement("div", null, "API key deleted successfully"),
        ),
      );
    } catch (err) {
      console.error("Failed to delete API key:", err);
      toast(
        React.createElement(
          React.Fragment,
          null,
          React.createElement("strong", null, "Failed to delete API key"),
          React.createElement("div", null, "Failed to delete API key"),
        ),
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    apiKeys,
    createApiKey,
    deleteApiKey,
    isLoading,
    error,
    refreshApiKeys: loadApiKeys,
  };
}
