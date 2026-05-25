'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useApiKeys } from '@/hooks/use-api-keys';
import { useSettings } from '@/hooks/use-settings';
import { ApiKeyCreator } from '@/components/ApiKey/ApiKeyCreator';
import { ApiKeysList } from '@/components/ApiKey/ApiKeysList';

export function ApiKeysTab() {
  const { apiKeys, isLoading, refreshApiKeys, createApiKey, deleteApiKey } =
    useApiKeys();
  const { settings } = useSettings();

  const handleChange = async () => {
    await refreshApiKeys();
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage API keys for integrating with your applications
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ApiKeyCreator onCreate={createApiKey} onKeyCreated={handleChange} />
          <ApiKeysList
            apiKeys={apiKeys}
            customDomain={settings.customDomain}
            isLoading={isLoading}
            onDelete={deleteApiKey}
            onKeyDeleted={handleChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
