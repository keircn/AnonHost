'use client';

import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/hooks/use-settings';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function DirectLinksSettings() {
  const { settings, updateSettingsField } = useSettings();

  return (
    <motion.div className="flex items-center justify-between" variants={fadeIn}>
      <div className="space-y-0.5">
        <Label htmlFor="direct-links">Direct Links</Label>
        <p className="text-muted-foreground text-sm">
          Enable direct links to your images
        </p>
      </div>
      <Switch
        id="direct-links"
        checked={settings.enableDirectLinks}
        onCheckedChange={(checked) =>
          updateSettingsField('enableDirectLinks', checked)
        }
      />
    </motion.div>
  );
}
