'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { ApiKey } from '@/types/settings';
import { ShareXConfigDialog } from '@/components/Files/ShareXConfigDialog';
import { DeleteApiKeyDialog } from '@/components/ApiKey/DeleteApiKeyDialog';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

interface ApiKeyItemProps {
  apiKey: ApiKey;
  customDomain?: string;
  onDelete: (id: string) => Promise<void>;
  onDeleted: () => Promise<void>;
}

export function ApiKeyItem({
  apiKey,
  customDomain,
  onDelete,
  onDeleted,
}: ApiKeyItemProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast(
      <div>
        <strong>Copied to clipboard</strong>
        <div>API key copied to clipboard</div>
      </div>
    );
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
      <Card className="bg-card/80 border-border/70">
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">{apiKey.name}</h4>
                <p className="text-muted-foreground text-xs">
                  Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                </p>
                {apiKey.lastUsed && (
                  <p className="text-muted-foreground text-xs">
                    Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <motion.div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(apiKey.key)}
                    title="Copy API Key"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </motion.div>
                <motion.div>
                  <ShareXConfigDialog
                    apiKey={apiKey}
                    customDomain={customDomain}
                  />
                </motion.div>
                <motion.div>
                  <DeleteApiKeyDialog
                    apiKey={apiKey}
                    onDelete={onDelete}
                    onDeleted={onDeleted}
                  />
                </motion.div>
              </div>
            </div>
            <div className="bg-muted/60 overflow-x-auto rounded-md border p-2 font-mono text-sm">
              {apiKey.key}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
