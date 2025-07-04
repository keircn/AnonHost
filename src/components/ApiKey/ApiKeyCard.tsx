import { ApiKey } from "@/types/settings";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { fadeIn } from "@/lib/animations";
import { ShareXConfigDialog } from "@/components/Files/ShareXConfigDialog";
import { DeleteApiKeyDialog } from "@/components/ApiKey/DeleteApiKeyDialog";

interface ApiKeyCardProps {
  apiKey: ApiKey;
  onCopy: (key: string) => void;
}

export const ApiKeyCard = ({ apiKey, onCopy }: ApiKeyCardProps) => {
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
                    onClick={() => onCopy(apiKey.key)}
                    title="Copy API Key"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </motion.div>
                <ShareXConfigDialog apiKey={apiKey} />
                <DeleteApiKeyDialog
                  apiKey={apiKey}
                  onDeleted={async () => {}}
                />
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
};
