'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/use-settings';
import { NotificationSettings } from '@/components/Settings/NotificationSettings';
import { DirectLinksSettings } from '@/components/Settings/DirectLinksSettings';
import { EmailChangeSection } from '@/components/Settings/EmailChangeSection';
import { CustomDomainSettings } from '@/components/Settings/CustomDomainSettings';
import { ImagePrivacySettings } from '@/components/Settings/ImagePrivacySettings';
import { EmbedSettingsSection } from '@/components/Settings/EmbedSettingsSection';

export function GeneralSettingsTab() {
  const { settings, updateSettings, updateSettingsField, isLoading } =
    useSettings();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateSettings();
      toast.success('Your settings have been saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Manage your account preferences and settings
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <NotificationSettings
              settings={settings}
              onFieldChange={updateSettingsField}
            />
            <DirectLinksSettings
              settings={settings}
              onFieldChange={updateSettingsField}
            />
            <ImagePrivacySettings
              settings={settings}
              onFieldChange={updateSettingsField}
            />
            <CustomDomainSettings
              settings={settings}
              onFieldChange={updateSettingsField}
            />
            <EmbedSettingsSection
              settings={settings}
              onFieldChange={updateSettingsField}
            />
            <EmailChangeSection />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
