'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { Settings } from '@/lib/settings';

interface CustomDomainSettingsProps {
  settings: Settings;
  onFieldChange: (
    field: keyof Settings,
    value: Settings[keyof Settings]
  ) => void;
}

export function CustomDomainSettings({
  settings,
  onFieldChange,
}: CustomDomainSettingsProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="custom-domain">Custom Domain</Label>
      <p className="text-muted-foreground mb-2 text-sm">
        Use your own domain for image URLs (requires DNS setup)
      </p>
      <Input
        id="custom-domain"
        placeholder="images.yourdomain.com"
        value={settings.customDomain || ''}
        onChange={(e) => onFieldChange('customDomain', e.target.value)}
      />
    </div>
  );
}
