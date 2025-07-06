'use client';

import { useState, useEffect, useCallback } from 'react';
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
      toast(
        <div>
          <strong>Error</strong>
          <div>Failed to fetch API keys</div>
        </div>
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  const createApiKey = useCallback(
    async (name: string) => {
      try {
        setIsLoading(true);
        await createKey(name);
        await loadApiKeys();
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to create API key')
        );
        toast(
          <div>
            <strong>Error</strong>
            <div>Failed to create API key</div>
          </div>
        );
      } finally {
        setIsLoading(false);
      }
    },
    [loadApiKeys]
  );

  const deleteApiKey = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        await deleteKey(id);
        await loadApiKeys();
        toast(
          <div>
            <strong>API key deleted</strong>
            <div>API key deleted successfully</div>
          </div>
        );
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to delete API key')
        );
        toast(
          <div>
            <strong>Failed to delete API key</strong>
            <div>Failed to delete API key</div>
          </div>
        );
      } finally {
        setIsLoading(false);
      }
    },
    [loadApiKeys]
  );

  return {
    apiKeys,
    isLoading,
    error,
    createApiKey,
    deleteApiKey,
    reload: loadApiKeys,
  };
}
