'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LuArrowRight,
  LuUpload,
  LuExternalLink,
  LuCircleCheck,
  LuCopy,
  LuTerminal,
  LuShield,
  LuImage,
  LuLink2,
  LuUser,
  LuHeart,
  LuHardDrive,
} from 'react-icons/lu';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import bytes from 'bytes';
import useSWR from 'swr';
import { Stats } from '@/types/stats';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerChildren = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

const features = [
  {
    title: 'Image Hosting',
    description:
      'Upload and share images instantly with direct links, preview pages, and automatic thumbnail generation.',
    icon: <LuImage className="text-primary h-5 w-5" />,
  },
  {
    title: 'URL Shortener',
    description:
      'Create clean, short links for any URL with custom domains support and click analytics.',
    icon: <LuLink2 className="text-primary h-5 w-5" />,
  },
  {
    title: 'Fast & Secure',
    description:
      'Lightning-fast uploads with secure file storage and reliable delivery.',
    icon: <LuUser className="text-primary h-5 w-5" />,
  },
  {
    title: 'API Access',
    description:
      'Integrate with our powerful API for programmatic uploads and URL shortening.',
    icon: <LuExternalLink className="text-primary h-5 w-5" />,
  },
  {
    title: 'European Privacy',
    description: 'Based in Europe with full GDPR compliance for your privacy.',
    icon: <LuShield className="text-primary h-5 w-5" />,
  },
  {
    title: 'Community Driven',
    description:
      'Funded by donations and maintained by a passionate developer.',
    icon: <LuHeart className="text-primary h-5 w-5" />,
  },
];

export function HomePageClient() {
  const [isCopied, setIsCopied] = useState(false);
  const installCommand = 'curl https://anon.love/install | bash';

  const fetcher = (url: string) => fetch(url).then((r) => r.json());

  const { data: stats, isLoading } = useSWR<Stats>('/api/stats', fetcher, {
    refreshInterval: 300000,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setIsCopied(true);
      toast.success('Copied: Install command copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Error: Failed to fetch stats');
    }
  };

  return (
    <div className="flex min-h-screen flex-col py-8">
      <main className="flex-1 pt-24">
        <section className="relative w-full overflow-hidden pt-8 pb-32">
          <div className="relative z-10 container mx-auto max-w-7xl px-4 md:px-6">
            <div className="max-w-8xl mx-auto grid items-center gap-6 lg:gap-12">
              <motion.div
                className="flex flex-col justify-center space-y-4 text-center sm:space-y-6 lg:text-left"
                variants={staggerChildren}
                initial="initial"
                animate="animate"
              >
                <motion.div
                  className="space-y-3 sm:space-y-4"
                  variants={fadeIn}
                >
                  <Badge
                    variant="secondary"
                    className="mb-2 inline-block text-sm font-medium"
                  >
                    Now in Beta
                  </Badge>
                  <h1 className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-3xl font-bold tracking-tighter text-transparent sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                    AnonHost
                  </h1>
                  <p className="text-muted-foreground mx-auto max-w-[600px] text-lg sm:text-xl md:text-2xl lg:mx-0">
                    Fast, easy image hosting without the hassle
                  </p>
                </motion.div>
                <motion.div
                  className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
                  variants={fadeIn}
                >
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      className="hover:bg-primary/80 w-full cursor-pointer gap-2 transition-all min-[400px]:w-auto"
                    >
                      Get Started
                      <LuArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/api">
                    <Button
                      size="lg"
                      variant="outline"
                      className="hover:bg-secondary/30 w-full cursor-pointer gap-2 min-[400px]:w-auto"
                    >
                      API Documentation
                      <LuExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link
                    href="https://ko-fi.com/qkeiran"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="hover:bg-secondary/30 w-full cursor-pointer gap-2 min-[400px]:w-auto"
                    >
                      Support Us
                      <LuHeart className="h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>

          <motion.div
            className="absolute top-[23%] left-[40%] z-20 hidden w-full max-w-[280px] transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:-rotate-6 hover:shadow-2xl sm:block md:top-[38%] md:left-[45%] md:max-w-[320px] lg:top-[33%] lg:left-[50%] lg:max-w-md xl:top-[28%] xl:left-[55%] xl:max-w-lg 2xl:top-[23%] 2xl:left-[55%]"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [2, 4, 2],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="translate-y-[min(0px,var(--scroll-offset,0px))] transform"
            >
              <Link href="/upload" className="block">
                <Card className="bg-background/95 cursor-pointer border-2 border-dashed shadow-xl backdrop-blur-sm transition-shadow hover:shadow-2xl">
                  <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-10">
                    <div className="bg-primary/10 mb-3 rounded-full p-3 sm:mb-4 sm:p-4">
                      <LuUpload className="text-primary h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        <section className="w-full py-12 sm:py-16 md:py-20">
          <motion.div
            className="container mx-auto max-w-7xl px-4 md:px-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="mb-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
                Trusted by users worldwide
              </h2>
              <p className="text-muted-foreground mx-auto max-w-lg">
                Join many of our users who trust AnonHost for their image
                hosting needs
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3">
              <motion.div
                className="bg-card relative rounded-xl border p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="bg-primary/10 absolute -top-4 left-1/2 -translate-x-1/2 rounded-full p-3">
                  <LuUser className="text-primary h-5 w-5" />
                </div>
                <h3 className="from-primary to-primary/70 mt-4 bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent">
                  {isLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    <CountUp
                      end={stats?.users ?? 0}
                      duration={2.5}
                      separator=","
                      formattingFn={(value) => Math.max(0, value).toString()}
                    />
                  )}
                </h3>
                <p className="text-muted-foreground mt-2">Registered Users</p>
              </motion.div>

              <motion.div
                className="bg-card relative rounded-xl border p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-primary/10 absolute -top-4 left-1/2 -translate-x-1/2 rounded-full p-3">
                  <LuImage className="text-primary h-5 w-5" />
                </div>
                <h3 className="from-primary to-primary/70 mt-4 bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent">
                  {isLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    <CountUp
                      end={stats?.uploads ?? 0}
                      duration={2.5}
                      separator=","
                      formattingFn={(value) => Math.max(0, value).toString()}
                    />
                  )}
                </h3>
                <p className="text-muted-foreground mt-2">Total Uploads</p>
              </motion.div>

              <motion.div
                className="bg-card relative rounded-xl border p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="bg-primary/10 absolute -top-4 left-1/2 -translate-x-1/2 rounded-full p-3">
                  <LuHardDrive className="text-primary h-5 w-5" />
                </div>
                <h3 className="from-primary to-primary/70 mt-4 bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent">
                  {isLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    <CountUp
                      end={Math.max(0, stats?.storage || 0)}
                      duration={2.5}
                      separator=","
                      formattingFn={(value) =>
                        bytes(value, {
                          unitSeparator: ' ',
                          decimalPlaces: 1,
                          fixedDecimals: true,
                        }) || '0 B'
                      }
                    />
                  )}
                </h3>
                <p className="text-muted-foreground mt-2">Storage Used</p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        <section className="w-full py-12 pb-0 sm:py-16 md:py-20 md:pb-0 lg:py-24 lg:pb-0 xl:py-32 xl:pb-0">
          <motion.div
            className="container mx-auto max-w-7xl px-4 md:px-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="mb-8 text-center sm:mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="mb-2 text-2xl font-bold tracking-tight sm:mb-3 sm:text-3xl">
                Why Choose AnonHost?
              </h2>
              <p className="text-muted-foreground mx-auto max-w-2xl text-sm sm:text-base">
                Our platform offers everything you need for seamless file
                hosting
              </p>
            </motion.div>

            <div className="max-w-8xl mx-auto grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-background rounded-xl border p-4 shadow-sm sm:p-6"
                >
                  <div className="bg-primary/10 mb-3 w-fit rounded-full p-2 sm:mb-4 sm:p-3">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-bold sm:text-xl">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32">
          <motion.div
            className="container mx-auto max-w-4xl px-4 md:px-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="bg-muted/50 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <LuTerminal className="text-primary h-6 w-6" />
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">
                      Command Line Interface
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Upload and manage files directly from your terminal.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <p className="text-muted-foreground text-sm sm:text-base">
                  Install the AnonHost CLI with a single command:
                </p>
                <div className="bg-muted flex flex-col items-stretch gap-2 rounded-md border p-3 sm:flex-row sm:items-center">
                  <code className="flex-1 bg-transparent font-mono text-sm break-all sm:text-base">
                    {installCommand}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="flex-shrink-0"
                    aria-label="Copy install command"
                  >
                    {isCopied ? (
                      <LuCircleCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <LuCopy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  Requires curl and bash. The script will install{' '}
                  <code>anonhost</code> to <code>~/.local/bin</code> and check
                  dependencies.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        <section className="w-full pb-12 sm:pb-16 md:pb-20 lg:pb-24 xl:pb-32">
          <motion.div
            className="container mx-auto max-w-7xl px-4 md:px-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="relative overflow-hidden rounded-xl p-6 sm:rounded-2xl sm:p-8 md:p-12 lg:p-16 xl:p-20"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="max-w-8xl relative z-10 mx-auto grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
                <div>
                  <h2 className="mb-3 text-2xl font-bold tracking-tight sm:mb-4 sm:text-3xl">
                    Ready to get started?
                  </h2>
                  <p className="text-muted-foreground mb-4 max-w-md text-sm sm:mb-6 sm:text-base">
                    Join thousands of users who trust AnonHost for their file
                    hosting needs.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      size="lg"
                      className="w-full cursor-pointer gap-2 sm:w-auto"
                      asChild
                    >
                      <Link href="/register">
                        Create Free Account
                        <LuArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full cursor-pointer gap-2 sm:w-auto"
                      asChild
                    >
                      <Link href="/pricing">View Pricing</Link>
                    </Button>
                  </div>
                </div>
                <div className="hidden justify-end lg:flex">
                  <motion.div
                    className="relative"
                    initial={{ rotate: -5 }}
                    animate={{ rotate: 5 }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: 'reverse',
                      duration: 5,
                      ease: 'easeInOut',
                    }}
                  >
                    <Card className="w-80 border shadow-lg">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="bg-primary/20 h-2 w-20 rounded-full" />
                          <div className="bg-muted h-2 w-full rounded-full" />
                          <div className="bg-muted h-2 w-full rounded-full" />
                          <div className="bg-muted h-2 w-3/4 rounded-full" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>

              <div className="bg-primary/5 absolute -top-24 -right-24 z-0 h-48 w-48 rounded-full blur-2xl sm:h-64 sm:w-64 sm:blur-3xl md:h-72 md:w-72 lg:h-96 lg:w-96" />
              <div className="bg-primary/5 absolute -bottom-32 -left-32 z-0 h-64 w-64 rounded-full blur-2xl sm:h-80 sm:w-80 sm:blur-3xl md:h-96 md:w-96 lg:h-[32rem] lg:w-[32rem]" />
            </motion.div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
