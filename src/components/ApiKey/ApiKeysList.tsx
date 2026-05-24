"use client";

import { ApiKeyItem } from "@/components/ApiKey/ApiKeyItem";
import type { ApiKey } from "@/types/settings";

interface ApiKeysListProps {
  apiKeys: ApiKey[];
  customDomain?: string;
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  onKeyDeleted: () => Promise<void>;
}

export function ApiKeysList({
  apiKeys,
  customDomain,
  isLoading,
  onDelete,
  onKeyDeleted,
}: ApiKeysListProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Your API Keys</h3>

      {isLoading ? (
        <div className="text-muted-foreground py-8 text-center">Loading API keys...</div>
      ) : apiKeys.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center">
          You don&apos;t have any API keys yet
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <ApiKeyItem
              key={apiKey.id}
              apiKey={apiKey}
              customDomain={customDomain}
              onDelete={onDelete}
              onDeleted={onKeyDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
