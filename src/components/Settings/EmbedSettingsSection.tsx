'use client';

import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Settings } from '@/lib/settings';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

interface EmbedSettingsSectionProps {
  settings: Settings;
  onFieldChange: (
    field: keyof Settings,
    value: Settings[keyof Settings]
  ) => void;
}

export function EmbedSettingsSection({
  settings,
  onFieldChange,
}: EmbedSettingsSectionProps) {
  return (
    <motion.div className="space-y-4" variants={fadeIn}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="disable-embed-default">Image-Only Links</Label>
          <p className="text-muted-foreground text-sm">
            Disable Open Graph embeds by default and serve raw images
          </p>
        </div>
        <Switch
          id="disable-embed-default"
          checked={settings.disableEmbedByDefault}
          onCheckedChange={(checked) =>
            onFieldChange('disableEmbedByDefault', checked)
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="embed-title-template">Embed Title Template</Label>
        <Input
          id="embed-title-template"
          value={settings.embedTitleTemplate}
          onChange={(e) => onFieldChange('embedTitleTemplate', e.target.value)}
          placeholder="{{filename}}"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="embed-description-template">
          Embed Description Template
        </Label>
        <Textarea
          id="embed-description-template"
          value={settings.embedDescriptionTemplate}
          onChange={(e) =>
            onFieldChange('embedDescriptionTemplate', e.target.value)
          }
          placeholder="Uploaded by {{uploader}}"
          rows={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="embed-site-name">Embed Site Name</Label>
          <Input
            id="embed-site-name"
            value={settings.embedSiteName}
            onChange={(e) => onFieldChange('embedSiteName', e.target.value)}
            placeholder="AnonHost"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="embed-accent-color">Embed Accent Color</Label>
          <Input
            id="embed-accent-color"
            value={settings.embedAccentColor}
            onChange={(e) => onFieldChange('embedAccentColor', e.target.value)}
            placeholder="#0ea5e9"
          />
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        Available variables: {'{{filename}}'}, {'{{uploader}}'}, {'{{size}}'},{' '}
        {'{{uploadedAt}}'}
      </p>
    </motion.div>
  );
}
