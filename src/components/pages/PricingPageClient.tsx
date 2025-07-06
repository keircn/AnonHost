'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LuCheck } from 'react-icons/lu';
import Link from 'next/link';

const features = {
  free: [
    'Up to 100MB per file',
    '1GB total storage',
    'Image optimization & conversion',
    'Video compression',
    'URL shortening',
    'Basic API access',
    'Community support',
  ],
  premium: [
    'Everything in Free, plus:',
    'Up to 500MB per file',
    'Unlimited storage',
    'Priority storage allocation',
    'Custom domains',
    'Advanced file processing',
    'Premium API features',
    'Priority support',
    'Early access to new features',
    'Support development',
  ],
};

export function PricingPageClient() {
  return (
    <div className="container mx-auto max-w-6xl space-y-12 py-16 md:mt-24">
      <motion.div
        className="space-y-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground text-lg">
          Choose the plan that works for you
        </p>
      </motion.div>

      <div className="grid gap-8 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader className="mb-6 space-y-1">
              <Badge variant="secondary" className="w-fit">
                Free Forever
              </Badge>
              <CardTitle className="text-2xl">Community</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground">/forever</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {features.free.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <LuCheck className="text-primary h-4 w-4" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/register">Get Started</Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-primary relative h-full overflow-hidden">
            <div className="bg-primary text-primary-foreground absolute top-0 right-0 rounded px-3 py-1 text-sm">
              Coming Soon
            </div>
            <CardHeader className="space-y-1">
              <Badge variant="default" className="bg-primary w-fit">
                Premium
              </Badge>
              <CardTitle className="text-2xl">Supporter</CardTitle>
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">$5</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <div className="text-muted-foreground text-sm">
                  or $50/year (save $10)
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {features.premium.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <LuCheck className="text-primary h-4 w-4" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Link
                href="https://ko-fi.com/qkeiran"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full" asChild>
                  <span>Donate</span>
                </Button>
              </Link>
              <p className="text-muted-foreground text-center text-sm">
                Join our{' '}
                <a
                  href="https://discord.gg/WZJksYs8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Discord
                </a>{' '}
                for more info
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      <motion.div
        className="text-muted-foreground text-center text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <p>
          All plans include GDPR compliance, EU hosting, and 99.9% uptime
          guarantee.
          <br />
          Currently in open beta - some features may be limited or unavailable.
        </p>
      </motion.div>
    </div>
  );
}
