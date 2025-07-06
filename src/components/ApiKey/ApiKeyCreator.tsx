"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useApiKeys } from "@/hooks/use-api-keys";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

interface ApiKeyCreatorProps {
  onKeyCreated: () => Promise<void>;
}

export function ApiKeyCreator({ onKeyCreated }: ApiKeyCreatorProps) {
  const { createApiKey } = useApiKeys();
  const [newKeyName, setNewKeyName] = useState("");
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Name required: Please provide a name for your API key");
      return;
    }

    setIsGeneratingKey(true);

    try {
      await createApiKey(newKeyName);
      setNewKeyName("");
      await onKeyCreated();
      toast.success("API key created successfully");
    } catch (error) {
      console.error("Failed to create API key:", error);
      toast.error(
        "Failed to create API key: There was an error creating your API key",
      );
    } finally {
      setIsGeneratingKey(false);
    }
  };

  return (
    <motion.div className="flex items-end gap-4" variants={fadeIn}>
      <div className="grid w-full gap-1.5">
        <Label htmlFor="key-name">New API Key Name</Label>
        <Input
          id="key-name"
          placeholder="e.g., Website Integration"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
        />
      </div>
      <Button onClick={handleCreateApiKey} disabled={isGeneratingKey}>
        {isGeneratingKey ? "Generating..." : "Generate Key"}
      </Button>
    </motion.div>
  );
}
