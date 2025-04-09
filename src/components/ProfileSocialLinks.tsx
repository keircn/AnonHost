"use client";

import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaX } from "react-icons/fa6";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfileSettings } from "@/hooks/use-profile-settings";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function ProfileSocialLinks() {
  const {
    profileSettings,
    updateSocialLinks,
    addSocialLink,
    removeSocialLink,
  } = useProfileSettings();

  return (
    <motion.div className="space-y-4" variants={fadeIn}>
      <Label>Social Links</Label>
      <div className="space-y-4">
        {profileSettings.socialLinks?.map((link, index) => (
          <div key={index} className="flex gap-2">
            <Select
              value={link.platform}
              onValueChange={(value) =>
                updateSocialLinks(index, "platform", value)
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="github">GitHub</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="discord">Discord</SelectItem>
                <SelectItem value="twitch">Twitch</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="website">Website</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="URL"
              value={link.url}
              onChange={(e) => updateSocialLinks(index, "url", e.target.value)}
            />
            <Button
              variant="destructive"
              size="icon"
              onClick={() => removeSocialLink(index)}
            >
              <FaX className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={() => addSocialLink()}>
          Add Social Link
        </Button>
      </div>
    </motion.div>
  );
}
