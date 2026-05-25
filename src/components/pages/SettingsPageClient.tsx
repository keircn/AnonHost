'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralSettingsTab } from '@/components/Settings/GeneralSettingsTab';
import { ApiKeysTab } from '@/components/ApiKey/ApiKeysTab';
import { useSettings } from '@/hooks/use-settings';
import { useApiKeys } from '@/hooks/use-api-keys';

export function SettingsPageClient() {
  const { status } = useSession();
  const [activeTab, setActiveTab] = useState('general');
  const { isLoading: isSettingsLoading } = useSettings();
  const { isLoading: isApiKeysLoading } = useApiKeys();

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/');
    }
  }, [status]);

  if (status === 'loading' || isSettingsLoading || isApiKeysLoading) {
    return (
      <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Account Settings</h1>

      <Tabs
        defaultValue="general"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <div>
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          </TabsList>
        </div>

        <div>
          <TabsContent value="general" forceMount>
            {activeTab === 'general' && <GeneralSettingsTab />}
          </TabsContent>

          <TabsContent value="api-keys" forceMount>
            {activeTab === 'api-keys' && <ApiKeysTab />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
