'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { GeneralSettingsTab } from '@/components/Settings/GeneralSettingsTab';
import { ApiKeysTab } from '@/components/ApiKey/ApiKeysTab';
import { useSettings } from '@/hooks/use-settings';
import { useApiKeys } from '@/hooks/use-api-keys';

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
  const [activeTab, setActiveTab] = useState('general');
  const { isLoading: isSettingsLoading } = useSettings();
  const { isLoading: isApiKeysLoading } = useApiKeys();

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/');
    }
  }, [status]);

  if (status === 'loading' || isSettingsLoading || isApiKeysLoading) {
    return (
      <motion.div
        className="container flex min-h-[calc(100vh-4rem)] items-center justify-center"
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
        className="mb-6 text-3xl font-bold"
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
              {activeTab === 'general' && <GeneralSettingsTab />}
            </TabsContent>

            <TabsContent value="api-keys" forceMount>
              {activeTab === 'api-keys' && <ApiKeysTab />}
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
}
