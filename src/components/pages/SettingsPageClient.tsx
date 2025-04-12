"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { GeneralSettingsTab } from "@/components/GeneralSettingsTab";
import { ProfileSettingsTab } from "@/components/ProfileSettingsTab";
import { ApiKeysTab } from "@/components/ApiKeysTab";
import { useSettings } from "@/hooks/use-settings";
import { useProfileSettings } from "@/hooks/use-profile-settings";
import { useApiKeys } from "@/hooks/use-api-keys";
import { Card } from "@/components/ui/card";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const slideAnimation = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export function SettingsPageClient() {
  const { status } = useSession();
  const [activeTab, setActiveTab] = useState("general");
  const { isLoading: isSettingsLoading } = useSettings();
  const { isLoading: isProfileLoading } = useProfileSettings();
  const { isLoading: isApiKeysLoading } = useApiKeys();

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/");
    }
  }, [status]);

  if (
    status === "loading" ||
    isSettingsLoading ||
    isProfileLoading ||
    isApiKeysLoading
  ) {
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

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            variants={slideAnimation}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="general" forceMount>
              {activeTab === "general" && <GeneralSettingsTab />}
            </TabsContent>

            <TabsContent value="profile" forceMount>
              {activeTab === "profile" && (
                <motion.div className="space-y-2" variants={fadeIn}>
                  <Card className="p-6">
                    <ProfileSettingsTab />
                  </Card>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="api-keys" forceMount>
              {activeTab === "api-keys" && <ApiKeysTab />}
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
}
