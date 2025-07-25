'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ApiKeyItem } from '@/components/ApiKey/ApiKeyItem';
import type { ApiKey } from '@/types/settings';

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

interface ApiKeysListProps {
  apiKeys: ApiKey[];
  isLoading: boolean;
  onKeyDeleted: () => Promise<void>;
}

export function ApiKeysList({
  apiKeys,
  isLoading,
  onKeyDeleted,
}: ApiKeysListProps) {
  return (
    <motion.div className="space-y-4" variants={staggerContainer}>
      <motion.h3 className="text-lg font-semibold" variants={fadeIn}>
        Your API Keys
      </motion.h3>

      <AnimatePresence>
        {isLoading ? (
          <motion.div
            className="text-muted-foreground py-8 text-center"
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            Loading API keys...
          </motion.div>
        ) : apiKeys.length === 0 ? (
          <motion.div
            className="text-muted-foreground py-8 text-center"
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            You don&apos;t have any API keys yet
          </motion.div>
        ) : (
          <motion.div className="space-y-4" variants={staggerContainer}>
            {apiKeys.map((apiKey) => (
              <ApiKeyItem
                key={apiKey.id}
                apiKey={apiKey}
                onDeleted={onKeyDeleted}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
