import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FileSettings } from "@/types/file-settings";
import { publicDomains } from "@/lib/domains";

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
  const [localSettings, setLocalSettings] = useState<FileSettings>(settings);
  const defaultDomain = "keiran.cc";

  const handleSave = () => {
    onSettingsChange({
      ...localSettings,
      domain:
        localSettings.domain === defaultDomain ? null : localSettings.domain,
    });
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
        <div className="grid gap-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public">Public Access</Label>
              <div className="text-sm text-muted-foreground">
                Allow anyone with the link to view this file
              </div>
            </div>
            <Switch
              id="public"
              checked={localSettings.public}
              onCheckedChange={(checked: boolean) =>
                setLocalSettings((prev: FileSettings) => ({
                  ...prev,
                  public: checked,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Custom Domain</Label>
            <Select
              value={localSettings.domain || defaultDomain}
              onValueChange={(value: string) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  domain: value === defaultDomain ? null : value,
                }))
              }
            >
              <SelectTrigger id="domain">
                <SelectValue placeholder="Select a domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={defaultDomain || "default"}>
                  {defaultDomain} (Default)
                </SelectItem>
                {publicDomains.filter(Boolean).map((domain) => (
                  <SelectItem key={domain} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
