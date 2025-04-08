"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Image from "next/image";
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
import { FaX } from "react-icons/fa6";
import { FaExternalLinkAlt } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { ApiKey } from "@/types/settings";
import {
  generateShareXConfig,
  downloadShareXConfig,
  generateShareXShortenerConfig,
} from "@/lib/sharex";

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
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export default function SettingsPage() {
  const { status, data: session } = useSession();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [newEmail, setNewEmail] = useState("");
  const [bmcEmail, setBmcEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [settings, setSettings] = useState({
    enableNotifications: true,
    enableDirectLinks: true,
    customDomain: "",
  });

  const [profileSettings, setProfileSettings] = useState({
    title: "",
    description: "",
    avatarUrl: "",
    bannerUrl: "",
    theme: "default",
    socialLinks: [] as Array<{ platform: string; url: string; id?: string }>,
  });

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
      fetchProfileData();
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "avatar");

    try {
      const response = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload image");

      const data = await response.json();

      await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profileSettings,
          avatarUrl: data.url,
        }),
      });

      setProfileSettings((prev) => ({
        ...prev,
        avatarUrl: data.url,
      }));

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully",
      });
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your avatar",
        variant: "destructive",
      });
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload image");

      const data = await response.json();

      await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profileSettings,
          bannerUrl: data.url,
        }),
      });

      setProfileSettings((prev) => ({
        ...prev,
        bannerUrl: data.url,
      }));

      toast({
        title: "Banner updated",
        description: "Your profile banner has been updated successfully",
      });
    } catch (error) {
      console.error("Failed to upload banner:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your banner",
        variant: "destructive",
      });
    }
  };

  const fetchProfileData = async () => {
    try {
      const response = await fetch("/api/settings/profile");
      if (response.ok) {
        const data = await response.json();
        setProfileSettings({
          title: data.title || "",
          description: data.description || "",
          avatarUrl: data.avatarUrl || "",
          bannerUrl: data.bannerUrl || "",
          theme: data.theme || "default",
          socialLinks: data.socialLinks || [],
        });

        console.log("Fetched profile data:", data);
      }
    } catch (error) {
      console.error("Failed to fetch profile settings:", error);
    }
  };

  const handleShareXConfig = (apiKey: ApiKey) => {
    const uploaderConfig = generateShareXConfig(
      apiKey.key,
      window.location.origin,
    );
    const shortenerConfig = generateShareXShortenerConfig(
      apiKey.key,
      window.location.origin,
    );

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
                      onClick={() => {
                        navigator.clipboard.writeText(
                          JSON.stringify(uploaderConfig, null, 2),
                        );
                        toast({
                          title: "Copied to clipboard",
                          description: "Image uploader configuration copied",
                        });
                      }}
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
                      onClick={() => {
                        navigator.clipboard.writeText(
                          JSON.stringify(shortenerConfig, null, 2),
                        );
                        toast({
                          title: "Copied to clipboard",
                          description: "URL shortener configuration copied",
                        });
                      }}
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
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          </TabsList>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial="initial"
            animate="animate"
            variants={slideAnimation}
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

                      <motion.div className="space-y-2" variants={fadeIn}>
                        <Label>BuyMeACoffee Membership</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Support the project with a monthly membership via
                          BuyMeACoffee to get Premium access.
                        </p>

                        <div className="flex flex-col gap-3">
                          <Button
                            variant="outline"
                            onClick={async () => {
                              try {
                                const res = await fetch(
                                  "/api/bmc/check-subscription",
                                );
                                const data = await res.json();

                                if (!res.ok) {
                                  throw new Error(
                                    data.error ||
                                      "Failed to verify subscription",
                                  );
                                }

                                if (data.subscribed) {
                                  toast({
                                    title: "Premium Activated",
                                    description:
                                      "Your membership has been verified and Premium access granted.",
                                  });
                                } else {
                                  toast({
                                    title: "No Active Membership",
                                    description:
                                      "We couldn't find an active membership for your account. Visit BuyMeACoffee to become a member.",
                                    variant: "destructive",
                                  });
                                }
                              } catch (error) {
                                toast({
                                  title: "Verification Failed",
                                  description:
                                    error instanceof Error
                                      ? error.message
                                      : "An unknown error occurred",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            Check Membership Status
                          </Button>

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-background px-2 text-muted-foreground">
                                Or verify with different email
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter your BuyMeACoffee email"
                              value={bmcEmail}
                              onChange={(e) => setBmcEmail(e.target.value)}
                            />
                            <Button
                              variant="outline"
                              onClick={async () => {
                                if (!bmcEmail) {
                                  toast({
                                    title: "Email Required",
                                    description:
                                      "Please enter your BuyMeACoffee email address",
                                    variant: "destructive",
                                  });
                                  return;
                                }

                                try {
                                  const res = await fetch(
                                    `/api/bmc/check-subscription?email=${encodeURIComponent(bmcEmail)}`,
                                  );
                                  const data = await res.json();

                                  if (!res.ok) {
                                    throw new Error(
                                      data.error ||
                                        "Failed to verify subscription",
                                    );
                                  }

                                  if (data.subscribed) {
                                    toast({
                                      title: "Premium Activated",
                                      description:
                                        "Your membership has been verified and Premium access granted.",
                                    });
                                    setBmcEmail("");
                                  } else {
                                    toast({
                                      title: "No Active Membership",
                                      description:
                                        "We couldn't find an active membership for this email address.",
                                      variant: "destructive",
                                    });
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Verification Failed",
                                    description:
                                      error instanceof Error
                                        ? error.message
                                        : "An unknown error occurred",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              Verify
                            </Button>
                          </div>
                        </div>
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

            <TabsContent value="profile">
              <motion.div className="space-y-2" variants={fadeIn}>
                <Label>Public Profile</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Customize your public profile page that others can view
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    window.open(`/p/${session?.user?.uid}`, "_blank")
                  }
                >
                  <FaExternalLinkAlt className="h-4 w-4" />
                  View Profile
                </Button>

                <Card className="p-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="profile-title">Profile Title</Label>
                      <Input
                        id="profile-title"
                        placeholder="Your display name"
                        value={profileSettings.title || ""}
                        onChange={(e) =>
                          setProfileSettings((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profile-description">Description</Label>
                      <Textarea
                        id="profile-description"
                        placeholder="Tell others about yourself"
                        value={profileSettings.description || ""}
                        onChange={(e) =>
                          setProfileSettings((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Profile Picture</Label>
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted">
                          {profileSettings.avatarUrl ? (
                            <Image
                              src={profileSettings.avatarUrl}
                              alt="Avatar preview"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900" />
                          )}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() =>
                            document.getElementById("avatar-upload")?.click()
                          }
                        >
                          Change Avatar
                        </Button>
                        <input
                          type="file"
                          id="avatar-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Profile Banner</Label>
                      <div className="relative aspect-[3/1] rounded-lg overflow-hidden bg-muted">
                        {profileSettings.bannerUrl ? (
                          <Image
                            src={profileSettings.bannerUrl}
                            alt="Banner preview"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-gray-900 to-gray-800" />
                        )}
                        <Button
                          variant="secondary"
                          className="absolute bottom-2 right-2"
                          onClick={() =>
                            document.getElementById("banner-upload")?.click()
                          }
                        >
                          Change Banner
                        </Button>
                        <input
                          type="file"
                          id="banner-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={handleBannerUpload}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Profile Theme</Label>
                      <Select
                        value={profileSettings.theme}
                        onValueChange={(value) =>
                          setProfileSettings((prev) => ({
                            ...prev,
                            theme: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="gradient">Gradient</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <Label>Social Links</Label>
                      <div className="space-y-4">
                        {profileSettings.socialLinks?.map((link, index) => (
                          <div key={index} className="flex gap-2">
                            <Select
                              value={link.platform}
                              onValueChange={(value) => {
                                const newLinks = [
                                  ...profileSettings.socialLinks,
                                ];
                                newLinks[index].platform = value;
                                setProfileSettings((prev) => ({
                                  ...prev,
                                  socialLinks: newLinks,
                                }));
                              }}
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
                                <SelectItem value="instagram">
                                  Instagram
                                </SelectItem>
                                <SelectItem value="website">Website</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="URL"
                              value={link.url}
                              onChange={(e) => {
                                const newLinks = [
                                  ...profileSettings.socialLinks,
                                ];
                                newLinks[index].url = e.target.value;
                                setProfileSettings((prev) => ({
                                  ...prev,
                                  socialLinks: newLinks,
                                }));
                              }}
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                const newLinks =
                                  profileSettings.socialLinks.filter(
                                    (_, i) => i !== index,
                                  );
                                setProfileSettings((prev) => ({
                                  ...prev,
                                  socialLinks: newLinks,
                                }));
                              }}
                            >
                              <FaX className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => {
                            setProfileSettings((prev) => ({
                              ...prev,
                              socialLinks: [
                                ...prev.socialLinks,
                                { platform: "website", url: "" },
                              ],
                            }));
                          }}
                        >
                          Add Social Link
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <Button
                        onClick={async () => {
                          try {
                            const response = await fetch(
                              "/api/settings/profile",
                              {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(profileSettings),
                              },
                            );

                            if (!response.ok)
                              throw new Error(
                                "Failed to save profile settings",
                              );

                            toast({
                              title: "Profile updated",
                              description:
                                "Your profile settings have been saved successfully",
                            });
                          } catch (error) {
                            console.error(
                              "Failed to save profile settings:",
                              error,
                            );
                            toast({
                              title: "Save failed",
                              description:
                                "There was an error saving your profile settings",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Save Profile
                      </Button>
                    </div>
                  </div>
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
                                          <motion.div
                                            whileHover={{ scale: 1.1 }}
                                          >
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
