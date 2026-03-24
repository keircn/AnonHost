import { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { FileSettings } from '@/types/file-settings';

interface FileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  settings: FileSettings;
  onSettingsChange: (settings: FileSettings) => void;
}

export function FileSettingsModal({
  isOpen,
  onClose,
  fileName,
  settings,
  onSettingsChange,
}: FileSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<FileSettings>({
    ...settings,
    stripMetadata: settings.stripMetadata ?? true,
    optimizeForWeb: settings.optimizeForWeb ?? true,
    compression: {
      ...settings.compression,
    },
    conversion: {
      ...settings.conversion,
    },
    resize: {
      ...settings.resize,
      fit: settings.resize.fit ?? 'inside',
    },
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setLocalSettings({
      ...settings,
      stripMetadata: settings.stripMetadata ?? true,
      optimizeForWeb: settings.optimizeForWeb ?? true,
      compression: {
        ...settings.compression,
      },
      conversion: {
        ...settings.conversion,
      },
      resize: {
        ...settings.resize,
        fit: settings.resize.fit ?? 'inside',
      },
    });
  }, [isOpen, settings]);

  const effectiveConversionEnabled =
    localSettings.conversion.enabled &&
    Boolean(localSettings.conversion.format);
  const effectiveResizeEnabled =
    localSettings.resize.enabled &&
    (Boolean(localSettings.resize.width) ||
      Boolean(localSettings.resize.height));

  const fileType = useMemo(() => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return {
      isImage: /^(jpg|jpeg|png|gif|webp)$/i.test(extension || ''),
      isVideo: /^(mp4|webm|mov)$/i.test(extension || ''),
    };
  }, [fileName]);

  const updateCompression = (
    update: Partial<typeof localSettings.compression>
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      compression: {
        ...prev.compression,
        ...update,
      },
    }));
  };

  const updateConversion = (
    update: Partial<typeof localSettings.conversion>
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      conversion: {
        ...prev.conversion,
        ...update,
      },
    }));
  };

  const updateResize = (update: Partial<typeof localSettings.resize>) => {
    setLocalSettings((prev) => ({
      ...prev,
      resize: {
        ...prev.resize,
        ...update,
      },
    }));
  };

  const handleSave = () => {
    const normalized = {
      ...localSettings,
      compression: {
        ...localSettings.compression,
        quality: Math.min(100, Math.max(1, localSettings.compression.quality)),
        enabled: localSettings.compression.enabled,
      },
      resize: {
        ...localSettings.resize,
        enabled: effectiveResizeEnabled,
        width:
          localSettings.resize.width && localSettings.resize.width > 0
            ? localSettings.resize.width
            : undefined,
        height:
          localSettings.resize.height && localSettings.resize.height > 0
            ? localSettings.resize.height
            : undefined,
      },
      conversion: {
        ...localSettings.conversion,
        enabled: effectiveConversionEnabled,
      },
    };

    onSettingsChange(normalized);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>File Settings</DialogTitle>
          <DialogDescription>
            Configure settings for {fileName}
          </DialogDescription>
        </DialogHeader>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="privacy">
            <AccordionTrigger>Privacy</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="public-toggle">Public Upload</Label>
                <Switch
                  id="public-toggle"
                  checked={localSettings.public}
                  onCheckedChange={(checked) =>
                    setLocalSettings((prev) => ({ ...prev, public: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="strip-metadata">Strip Metadata</Label>
                <Switch
                  id="strip-metadata"
                  checked={localSettings.stripMetadata}
                  onCheckedChange={(checked) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      stripMetadata: checked,
                    }))
                  }
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {(fileType.isImage || fileType.isVideo) && (
            <AccordionItem value="optimization">
              <AccordionTrigger>Optimization</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="optimize-web">Optimize for Web</Label>
                  <Switch
                    id="optimize-web"
                    checked={Boolean(localSettings.optimizeForWeb)}
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        optimizeForWeb: checked,
                      }))
                    }
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Prioritizes smaller file size and faster loading while keeping
                  visual quality.
                </p>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* <AccordionItem value="domain">
            <AccordionTrigger>Custom Domain</AccordionTrigger>
            <AccordionContent>
              <Select
                value={localSettings.domain || defaultDomain}
                onValueChange={(value: string) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    domain: value === defaultDomain ? null : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={defaultDomain}>
                    {defaultDomain} (Default)
                  </SelectItem>
                  {publicDomains.filter(Boolean).map((domain) => (
                    <SelectItem key={domain} value={domain}>
                      {domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem> */}

          {fileType.isImage && (
            <AccordionItem value="compression">
              <AccordionTrigger>Compression</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="compression-toggle">Enable Compression</Label>
                  <Switch
                    id="compression-toggle"
                    checked={localSettings.compression.enabled}
                    onCheckedChange={(checked) =>
                      updateCompression({ enabled: checked })
                    }
                  />
                </div>
                {localSettings.compression.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="quality">
                      Quality ({localSettings.compression.quality}%)
                    </Label>
                    <Input
                      id="quality"
                      type="range"
                      min="1"
                      max="100"
                      value={localSettings.compression.quality}
                      onChange={(e) =>
                        updateCompression({
                          quality: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {(fileType.isImage || fileType.isVideo) && (
            <AccordionItem value="conversion">
              <AccordionTrigger>Format Conversion</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="conversion-toggle">Enable Conversion</Label>
                  <Switch
                    id="conversion-toggle"
                    checked={localSettings.conversion.enabled}
                    onCheckedChange={(checked) =>
                      updateConversion({ enabled: checked })
                    }
                  />
                </div>
                {localSettings.conversion.enabled && (
                  <Select
                    value={localSettings.conversion.format}
                    onValueChange={(value) =>
                      updateConversion({
                        format: value as typeof localSettings.conversion.format,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {fileType.isImage && (
                        <>
                          <SelectItem value="webp">WebP</SelectItem>
                          <SelectItem value="jpeg">JPEG</SelectItem>
                          <SelectItem value="png">PNG</SelectItem>
                          <SelectItem value="gif">GIF</SelectItem>
                        </>
                      )}
                      {fileType.isVideo && (
                        <>
                          <SelectItem value="mp4">MP4</SelectItem>
                          <SelectItem value="webm">WebM</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {(fileType.isImage || fileType.isVideo) && (
            <AccordionItem value="resize">
              <AccordionTrigger>Resize</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="resize-toggle">Enable Resize</Label>
                  <Switch
                    id="resize-toggle"
                    checked={localSettings.resize.enabled}
                    onCheckedChange={(checked) =>
                      updateResize({ enabled: checked })
                    }
                  />
                </div>
                {localSettings.resize.enabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="width">Width</Label>
                        <Input
                          id="width"
                          type="number"
                          placeholder="Width"
                          value={localSettings.resize.width || ''}
                          onChange={(e) =>
                            updateResize({
                              width: parseInt(e.target.value) || undefined,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height">Height</Label>
                        <Input
                          id="height"
                          type="number"
                          placeholder="Height"
                          value={localSettings.resize.height || ''}
                          onChange={(e) =>
                            updateResize({
                              height: parseInt(e.target.value) || undefined,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="aspect-ratio">
                        Maintain aspect ratio
                      </Label>
                      <Switch
                        id="aspect-ratio"
                        checked={localSettings.resize.maintainAspectRatio}
                        onCheckedChange={(checked) =>
                          updateResize({ maintainAspectRatio: checked })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="resize-fit">Resize fit mode</Label>
                      <Select
                        value={localSettings.resize.fit}
                        onValueChange={(value) =>
                          updateResize({
                            fit: value as typeof localSettings.resize.fit,
                          })
                        }
                      >
                        <SelectTrigger id="resize-fit">
                          <SelectValue placeholder="Select fit mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inside">Inside</SelectItem>
                          <SelectItem value="cover">Cover</SelectItem>
                          <SelectItem value="contain">Contain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
