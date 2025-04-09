"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ApiKey } from "@/types/settings";
import { ShareXConfigDialog } from "@/components/ShareXConfigDialog";
import { DeleteApiKeyDialog } from "@/components/DeleteApiKeyDialog";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

interface ApiKeyItemProps {
  apiKey: ApiKey;
  onDeleted: () => Promise<void>;
}

export function ApiKeyItem({ apiKey, onDeleted }: ApiKeyItemProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "API key copied to clipboard",
    });
  };

  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      layoutId={apiKey.id}
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{apiKey.name}</h4>
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                </p>
                {apiKey.lastUsed && (
                  <p className="text-xs text-muted-foreground">
                    Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <motion.div whileHover={{ scale: 1.1 }}>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(apiKey.key)}
                    title="Copy API Key"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }}>
                  <ShareXConfigDialog apiKey={apiKey} />
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }}>
                  <DeleteApiKeyDialog apiKey={apiKey} onDeleted={onDeleted} />
                </motion.div>
              </div>
            </div>
            <div className="bg-muted p-2 rounded-md font-mono text-sm overflow-x-auto">
              {apiKey.key}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
