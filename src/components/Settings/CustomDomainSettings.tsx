'use client';

import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { Settings } from '@/lib/settings';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

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
    <motion.div className="space-y-2" variants={fadeIn}>
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
    </motion.div>
  );
}
