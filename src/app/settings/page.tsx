"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Copy, Trash2, Download } from "lucide-react";
import { SiSharex } from "react-icons/si";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

const slideAnimation = {
  enter: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
};

const downloadShareXConfig = (config: object, apiKeyName: string) => {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `anonhost-${apiKeyName.toLowerCase().replace(/\s+/g, '-')}.sxcu`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
}

export default function SettingsPage() {
  const { status } = useSession();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    enableNotifications: true,
    makeImagesPublic: false,
    enableDirectLinks: true,
    customDomain: "",
  });
  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/");
      return;
    }

    if (status === "authenticated") {
      const fetchData = async () => {
        try {
          const settingsResponse = await fetch("/api/settings");
          if (settingsResponse.ok) {
            const data = await settingsResponse.json();
            setSettings({
              enableNotifications: data.enableNotifications,
              makeImagesPublic: data.makeImagesPublic,
              enableDirectLinks: data.enableDirectLinks,
              customDomain: data.customDomain || "",
            });
          }
        } catch (error) {
          console.error("Failed to fetch settings:", error);
        }

        try {
          const keysResponse = await fetch("/api/keys");
          if (keysResponse.ok) {
            const keys = await keysResponse.json();
            setApiKeys(keys);
          }
        } catch (error) {
          console.error("Failed to fetch API keys:", error);
          toast({
            title: "Error",
            description: "Failed to fetch API keys",
            variant: "destructive",
          });
        }
      };

      fetchData();
    }
  }, [status, toast]);

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Name required",
        description: "Please provide a name for your API key",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingKey(true);

    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (!response.ok) throw new Error("Failed to create API key");

      const newKey = await response.json();
      setApiKeys((prev) => [...prev, newKey]);
      setNewKeyName("");

      toast({
        title: "API key created",
        description: "Your new API key has been created successfully",
      });
    } catch (error) {
      console.error("Failed to create API key:", error);
      toast({
        title: "Failed to create API key",
        description: "There was an error creating your API key",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      const response = await fetch(`/api/keys/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete API key");

      setApiKeys((prev) => prev.filter((key) => key.id !== id));

      toast({
        title: "API key deleted",
        description: "Your API key has been deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete API key:", error);
      toast({
        title: "Failed to delete API key",
        description: "There was an error deleting your API key",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "API key copied to clipboard",
    });
  };

  const handleSaveSettings = async () => {
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "Your settings have been saved successfully",
        });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  function generateShareXConfig(apiKey: string, baseUrl: string) {
    return {
      Version: "17.0.0",
      Name: "AnonHost",
      DestinationType: "ImageUploader",
      RequestMethod: "POST",
      RequestURL: `${baseUrl}/api/upload`,
      Headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      Body: "MultipartFormData",
      FileFormName: "file",
      URL: "{json:url}",
      ThumbnailURL: "$json:url$",
      DeletionURL: "",
      ErrorMessage: "$json:error$",
    };
  }

  const handleShareXConfig = (apiKey: ApiKey) => {
    const config = generateShareXConfig(apiKey.key, window.location.origin);
    return (
      <Dialog>
        <DialogTrigger asChild>
          <motion.div whileHover={{ scale: 1.1 }}>
            <Button
              variant="outline"
              size="icon"
              title="Export ShareX Config"
            >
              <SiSharex className="h-4 w-4" />
            </Button>
          </motion.div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export ShareX Configuration</DialogTitle>
            <DialogDescription>
              Choose how you want to use the ShareX configuration file.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              To use this configuration in ShareX, you need to import it. You can either download the config file or copy it to your clipboard.
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => downloadShareXConfig(config, apiKey.name)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Config File
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(config, null, 2));
                  toast({
                    title: "Copied to clipboard",
                    description: "ShareX configuration copied to clipboard",
                  });
                }}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy to Clipboard
              </Button>
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

  if (status === "loading") {
    return (
      <motion.div
        className="container flex items-center justify-center min-h-[calc(100vh-4rem)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="text-center">Loading...</div>
      </motion.div>
    );
  }

  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsChangingEmail(true);

    try {
      const response = await fetch("/api/settings/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });

      if (!response.ok) throw new Error("Failed to update email");

      toast({
        title: "Verification email sent",
        description:
          "Please check your new email address to confirm the change",
      });
      setNewEmail("");
    } catch (error) {
      console.error("Failed to change email:", error);
      toast({
        title: "Error",
        description: "Failed to update email address",
        variant: "destructive",
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  return (
    <motion.div
      className="container py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.h1
        className="text-3xl font-bold mb-6"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        Account Settings
      </motion.h1>

      <Tabs
        defaultValue="general"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <motion.div variants={fadeIn} initial="initial" animate="animate">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          </TabsList>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial="initial"
            animate="animate"
            variants={slideAnimation.enter}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <TabsContent
              value="general"
              forceMount={activeTab === "general" ? true : undefined}
            >
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                <Card>
                  <CardHeader>
                    <motion.div variants={fadeIn}>
                      <CardTitle>General Settings</CardTitle>
                      <CardDescription>
                        Manage your account preferences and settings
                      </CardDescription>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <motion.div
                      className="space-y-4"
                      variants={staggerContainer}
                    >
                      {[
                        {
                          id: "notifications",
                          title: "Email Notifications",
                          description:
                            "Receive email notifications about your account activity",
                          checked: settings.enableNotifications,
                          onChange: (checked: boolean) =>
                            setSettings({
                              ...settings,
                              enableNotifications: checked,
                            }),
                        },
                        {
                          id: "public-images",
                          title: "Public Images",
                          description:
                            "Make all your uploaded images publicly accessible",
                          checked: settings.makeImagesPublic,
                          onChange: (checked: boolean) =>
                            setSettings({
                              ...settings,
                              makeImagesPublic: checked,
                            }),
                        },
                        {
                          id: "direct-links",
                          title: "Direct Links",
                          description: "Enable direct links to your images",
                          checked: settings.enableDirectLinks,
                          onChange: (checked: boolean) =>
                            setSettings({
                              ...settings,
                              enableDirectLinks: checked,
                            }),
                        },
                      ].map((setting) => (
                        <motion.div
                          key={setting.id}
                          className="flex items-center justify-between"
                          variants={fadeIn}
                        >
                          <div className="space-y-0.5">
                            <Label htmlFor={setting.id}>{setting.title}</Label>
                            <p className="text-sm text-muted-foreground">
                              {setting.description}
                            </p>
                          </div>
                          <Switch
                            id={setting.id}
                            checked={setting.checked}
                            onCheckedChange={setting.onChange}
                          />
                        </motion.div>
                      ))}

                      <motion.div className="space-y-2" variants={fadeIn}>
                        <Label htmlFor="email">Email Address</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Change your email address (requires verification)
                        </p>
                        <div className="flex gap-2">
                          <Input
                            id="email"
                            type="email"
                            placeholder="New email address"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                          />
                          <Button
                            variant="outline"
                            onClick={handleEmailChange}
                            disabled={isChangingEmail}
                          >
                            {isChangingEmail ? "Changing..." : "Change"}
                          </Button>
                        </div>
                      </motion.div>

                      <motion.div className="space-y-2" variants={fadeIn}>
                        <Label htmlFor="custom-domain">Custom Domain</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Use your own domain for image URLs (requires DNS
                          setup)
                        </p>
                        <Input
                          id="custom-domain"
                          placeholder="images.yourdomain.com"
                          value={settings.customDomain}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              customDomain: e.target.value,
                            })
                          }
                        />
                      </motion.div>
                    </motion.div>

                    <motion.div className="flex justify-end" variants={fadeIn}>
                      <Button onClick={handleSaveSettings}>
                        Save Settings
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="api-keys">
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                <Card>
                  <CardHeader>
                    <motion.div variants={fadeIn}>
                      <CardTitle>API Keys</CardTitle>
                      <CardDescription>
                        Manage API keys for integrating with your applications
                      </CardDescription>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <motion.div
                      className="flex items-end gap-4"
                      variants={fadeIn}
                    >
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="key-name">New API Key Name</Label>
                        <Input
                          id="key-name"
                          placeholder="e.g., Website Integration"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleCreateApiKey}
                        disabled={isGeneratingKey}
                      >
                        {isGeneratingKey ? "Generating..." : "Generate Key"}
                      </Button>
                    </motion.div>

                    <motion.div
                      className="space-y-4"
                      variants={staggerContainer}
                    >
                      <motion.h3
                        className="text-lg font-semibold"
                        variants={fadeIn}
                      >
                        Your API Keys
                      </motion.h3>

                      <AnimatePresence>
                        {apiKeys.length === 0 ? (
                          <motion.div
                            className="text-center py-8 text-muted-foreground"
                            variants={fadeIn}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                          >
                            You don&apos;t have any API keys yet
                          </motion.div>
                        ) : (
                          <motion.div
                            className="space-y-4"
                            variants={staggerContainer}
                          >
                            {apiKeys.map((apiKey) => (
                              <motion.div
                                key={apiKey.id}
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
                                          <h4 className="font-medium">
                                            {apiKey.name}
                                          </h4>
                                          <p className="text-xs text-muted-foreground">
                                            Created:{" "}
                                            {new Date(
                                              apiKey.createdAt,
                                            ).toLocaleDateString()}
                                          </p>
                                          {apiKey.lastUsed && (
                                            <p className="text-xs text-muted-foreground">
                                              Last used:{" "}
                                              {new Date(
                                                apiKey.lastUsed,
                                              ).toLocaleDateString()}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex gap-2">
                                          <motion.div
                                            whileHover={{ scale: 1.1 }}
                                          >
                                            <Button
                                              variant="outline"
                                              size="icon"
                                              onClick={() =>
                                                copyToClipboard(apiKey.key)
                                              }
                                              title="Copy API Key"
                                            >
                                              <Copy className="h-4 w-4" />
                                            </Button>
                                          </motion.div>
                                          <motion.div whileHover={{ scale: 1.1 }}>
                                            {handleShareXConfig(apiKey)}
                                          </motion.div>
                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <motion.div
                                                whileHover={{ scale: 1.1 }}
                                              >
                                                <Button
                                                  variant="destructive"
                                                  size="icon"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </motion.div>
                                            </DialogTrigger>
                                            <DialogContent>
                                              <DialogHeader>
                                                <DialogTitle>
                                                  Delete API Key
                                                </DialogTitle>
                                                <DialogDescription>
                                                  Are you sure you want to
                                                  delete this API key? This
                                                  action cannot be undone.
                                                </DialogDescription>
                                              </DialogHeader>
                                              <DialogFooter>
                                                <Button
                                                  variant="destructive"
                                                  onClick={() =>
                                                    handleDeleteApiKey(
                                                      apiKey.id,
                                                    )
                                                  }
                                                >
                                                  Delete
                                                </Button>
                                              </DialogFooter>
                                            </DialogContent>
                                          </Dialog>
                                        </div>
                                      </div>
                                      <div className="bg-muted p-2 rounded-md font-mono text-sm overflow-x-auto">
                                        {apiKey.key}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
}
