import { ApiKey } from "@/types/settings";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Download } from "lucide-react";
import { SiSharex } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import {
  generateShareXConfig,
  generateShareXShortenerConfig,
  downloadShareXConfig,
} from "@/lib/sharex";

interface ShareXConfigDialogProps {
  apiKey: ApiKey;
}

export const ShareXConfigDialog = ({ apiKey }: ShareXConfigDialogProps) => {
  const { toast } = useToast();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const uploaderConfig = generateShareXConfig(apiKey.key, baseUrl);
  const shortenerConfig = generateShareXShortenerConfig(apiKey.key, baseUrl);

  const handleCopyConfig = (config: object, type: string) => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    toast({
      title: "Copied to clipboard",
      description: `${type} configuration copied`,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.1 }}>
          <Button variant="outline" size="icon" title="Export ShareX Config">
            <SiSharex className="h-4 w-4" />
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export ShareX Configuration</DialogTitle>
          <DialogDescription>
            Choose which ShareX configuration you want to use.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Select the type of configuration you want to export for ShareX.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <CardHeader className="p-0">
                <CardTitle className="text-base">Image Uploader</CardTitle>
                <CardDescription>
                  Upload images directly to AnonHost
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() =>
                      downloadShareXConfig(
                        uploaderConfig,
                        `${apiKey.name}-uploader`,
                      )
                    }
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleCopyConfig(uploaderConfig, "Image uploader")
                    }
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardHeader className="p-0">
                <CardTitle className="text-base">URL Shortener</CardTitle>
                <CardDescription>Shorten URLs with AnonHost</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() =>
                      downloadShareXConfig(
                        shortenerConfig,
                        `${apiKey.name}-shortener`,
                      )
                    }
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleCopyConfig(shortenerConfig, "URL shortener")
                    }
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <p className="text-sm">
            <a
              href="https://getsharex.com/docs/custom-uploader#sxcu-file"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Learn how to import ShareX configurations →
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
