"use client";

import { useState, useEffect, useCallback } from "react";
import type { ApiKey } from "@/types/settings";
import {
  fetchApiKeys,
  createApiKey as createKey,
  deleteApiKey as deleteKey,
} from "@/lib/api-keys";
import { useToast } from "@/hooks/use-toast";

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

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
      toast({
        title: "Error",
        description: "Failed to fetch API keys",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
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
      toast({
        title: "API key deleted",
        description: "Your API key has been deleted successfully",
      });
    } catch (err) {
      console.error("Failed to delete API key:", err);
      toast({
        title: "Failed to delete API key",
        description: "There was an error deleting your API key",
        variant: "destructive",
      });
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
