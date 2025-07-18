'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Server, Lock, Key } from 'lucide-react';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const sections = [
  {
    icon: <Lock className="text-primary h-6 w-6" />,
    title: 'Data Encryption',
    content: [
      'AES-256 encryption for all stored data',
      'End-to-end encryption in transit',
      'Zero-knowledge encryption',
      'Military-grade security protocols',
    ],
  },
  {
    icon: <Key className="text-primary h-6 w-6" />,
    title: 'Security Measures',
    content: [
      'Multi-layer data protection',
      'Regular package updates and security patches',
      'Secure key management system',
    ],
  },
  {
    icon: <Server className="text-primary h-6 w-6" />,
    title: 'Storage Security',
    content: [
      'Data encrypted at rest with industry standards',
      'Redundant secure storage - Cloudflare R2',
      'Automated backup systems',
    ],
  },
];

export function PrivacyPageClient() {
  return (
    <div className="container py-8 md:py-12">
      <motion.div
        className="space-y-8"
        initial="initial"
        animate="animate"
        variants={{
          animate: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        <motion.div className="space-y-4 text-center" variants={fadeIn}>
          <h1 className="text-4xl font-bold tracking-tight">
            We take your privacy seriously
          </h1>
        </motion.div>

        <motion.div className="grid gap-6 md:grid-cols-3" variants={fadeIn}>
          {sections.map((section) => (
            <motion.div
              key={section.title}
              variants={fadeIn}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-4">
                    {section.icon}
                    <h2 className="text-xl font-semibold">{section.title}</h2>
                  </div>
                  <ul className="space-y-2">
                    {section.content.map((item, i) => (
                      <li
                        key={i}
                        className="text-muted-foreground flex items-start"
                      >
                        <span className="text-primary mr-2">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="bg-primary/5 mx-auto max-w-3xl rounded-lg p-6"
          variants={fadeIn}
        >
          <h3 className="mb-3 text-center text-lg font-semibold">
            Our Encryption Promise
          </h3>
          <p className="text-muted-foreground text-center text-sm">
            Every file is encrypted using AES-256 encryption before storage,
            with keys secured using RSA-4096. Data in transit is protected by
            TLS 1.3, ensuring end-to-end security. Our zero-knowledge
            architecture means even we cannot access your encrypted data without
            your explicit permission.
          </p>
        </motion.div>

        <motion.div
          className="text-muted-foreground mx-auto max-w-2xl space-y-4 text-center text-sm"
          variants={fadeIn}
        >
          <p>
            To exercise your privacy rights or ask questions about our privacy
            practices, please contact us at{' '}
            <span className="text-primary">support@anon.love</span>
          </p>
          <p className="text-xs">
            Last updated: April 2, 2025. AnonHost is committed to protecting
            your privacy and maintaining the security of your personal
            information.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
