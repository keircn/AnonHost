'use client';

import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useApiKeys } from '@/hooks/use-api-keys';
import { useSettings } from '@/hooks/use-settings';
import { ApiKeyCreator } from '@/components/ApiKey/ApiKeyCreator';
import { ApiKeysList } from '@/components/ApiKey/ApiKeysList';

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

export function ApiKeysTab() {
  const { apiKeys, isLoading, refreshApiKeys, createApiKey, deleteApiKey } =
    useApiKeys();
  const { settings } = useSettings();

  const handleChange = async () => {
    await refreshApiKeys();
  };

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate">
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
          <ApiKeyCreator onCreate={createApiKey} onKeyCreated={handleChange} />
          <ApiKeysList
            apiKeys={apiKeys}
            customDomain={settings.customDomain}
            isLoading={isLoading}
            onDelete={deleteApiKey}
            onKeyDeleted={handleChange}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
