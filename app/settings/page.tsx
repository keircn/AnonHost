"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Copy, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { motion } from "framer-motion"

interface ApiKey {
  id: string
  name: string
  key: string
  createdAt: string
  lastUsed: string | null
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState("")
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)
  const [settings, setSettings] = useState({
    enableNotifications: true,
    makeImagesPublic: false,
    enableDirectLinks: true,
    customDomain: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/")
    }

    if (status === "authenticated") {
      const fetchSettings = async () => {
        try {
          const response = await fetch("/api/settings")
          if (response.ok) {
            const data = await response.json()
            setSettings({
              enableNotifications: data.enableNotifications,
              makeImagesPublic: data.makeImagesPublic,
              enableDirectLinks: data.enableDirectLinks,
              customDomain: data.customDomain || "",
            })
          }
        } catch (error) {
          console.error("Failed to fetch settings:", error)
        }
      }

      fetchSettings()
      fetchApiKeys()
    }
  }, [status])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/keys")
      if (response.ok) {
        const keys = await response.json()
        setApiKeys(keys)
      } else {
        throw new Error("Failed to fetch API keys")
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error)
      toast({
        title: "Error",
        description: "Failed to fetch API keys",
        variant: "destructive",
      })
    }
  }

  const generateRandomString = (length: number) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Name required",
        description: "Please provide a name for your API key",
        variant: "destructive",
      })
      return
    }
  
    setIsGeneratingKey(true)
  
    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      })
  
      if (!response.ok) {
        throw new Error("Failed to create API key")
      }
  
      const newKey = await response.json()
      setApiKeys((prev) => [...prev, newKey])
      setNewKeyName("")
  
      toast({
        title: "API key created",
        description: "Your new API key has been created successfully",
      })
    } catch (error) {
      console.error("Failed to create API key:", error)
      toast({
        title: "Failed to create API key",
        description: "There was an error creating your API key",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingKey(false)
    }
  }

  const handleDeleteApiKey = async (id: string) => {
    try {
      const response = await fetch(`/api/keys/${id}`, {
        method: "DELETE",
      })
  
      if (!response.ok) {
        throw new Error("Failed to delete API key")
      }
  
      setApiKeys((prev) => prev.filter((key) => key.id !== id))
  
      toast({
        title: "API key deleted",
        description: "Your API key has been deleted successfully",
      })
    } catch (error) {
      console.error("Failed to delete API key:", error)
      toast({
        title: "Failed to delete API key",
        description: "There was an error deleting your API key",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "API key copied to clipboard",
    })
  }

  const handleSaveSettings = async () => {
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "Your settings have been saved successfully",
        })
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    }
  }

  if (status === "loading") {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your account preferences and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications about your account activity
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="public-images">Public Images</Label>
                    <p className="text-sm text-muted-foreground">Make all your uploaded images publicly accessible</p>
                  </div>
                  <Switch
                    id="public-images"
                    checked={settings.makeImagesPublic}
                    onCheckedChange={(checked) => setSettings({ ...settings, makeImagesPublic: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="direct-links">Direct Links</Label>
                    <p className="text-sm text-muted-foreground">Enable direct links to your images</p>
                  </div>
                  <Switch
                    id="direct-links"
                    checked={settings.enableDirectLinks}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableDirectLinks: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-domain">Custom Domain</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Use your own domain for image URLs (requires DNS setup)
                  </p>
                  <Input
                    id="custom-domain"
                    placeholder="images.yourdomain.com"
                    value={settings.customDomain}
                    onChange={(e) => setSettings({ ...settings, customDomain: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings}>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API keys for integrating with your applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end gap-4">
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
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Your API Keys</h3>

                {apiKeys.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">You don't have any API keys yet</div>
                ) : (
                  <div className="space-y-4">
                    {apiKeys.map((apiKey, index) => (
                      <motion.div
                        key={apiKey.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
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
                                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(apiKey.key)}>
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="destructive" size="icon">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Delete API Key</DialogTitle>
                                        <DialogDescription>
                                          Are you sure you want to delete this API key? This action cannot be undone.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <DialogFooter>
                                        <Button variant="destructive" onClick={() => handleDeleteApiKey(apiKey.id)}>
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
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

