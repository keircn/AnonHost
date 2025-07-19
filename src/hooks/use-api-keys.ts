'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ApiKey } from '@/types/settings';
import {
  fetchApiKeys,
  createApiKey as createKey,
  deleteApiKey as deleteKey,
} from '@/lib/api-keys';
import { toast } from 'sonner';

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
        err instanceof Error ? err : new Error('Failed to load API keys')
      );
      console.error('Failed to load API keys:', err);
      toast.error('Failed to fetch API keys');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  const createApiKey = useCallback(async (name: string) => {
    try {
      setIsLoading(true);
      const newKey = await createKey(name);
      // Optimistically update the state instead of refetching
      setApiKeys((currentKeys) => [...currentKeys, newKey]);
      setError(null);
      toast.success('API key created successfully');
      return newKey;
    } catch (err) {
      console.error('Failed to create API key:', err);
      toast.error('Failed to create API key');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteApiKey = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      await deleteKey(id);
      // Optimistically update the state instead of refetching
      setApiKeys((currentKeys) => currentKeys.filter((key) => key.id !== id));
      setError(null);
      toast.success('API key deleted successfully');
    } catch (err) {
      console.error('Failed to delete API key:', err);
      toast.error('Failed to delete API key');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    apiKeys,
    createApiKey,
    deleteApiKey,
    isLoading,
    error,
    refreshApiKeys: loadApiKeys,
  }), [apiKeys, createApiKey, deleteApiKey, isLoading, error, loadApiKeys]);
}
