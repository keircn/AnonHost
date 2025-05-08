"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "react-icons/lu";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import bytes from "bytes";
import useSWR from "swr";
import { Stats } from "@/types/stats";

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
    title: "Image Hosting",
    description:
      "Upload and share images instantly with direct links, preview pages, and automatic thumbnail generation.",
    icon: <LuImage className="h-5 w-5 text-primary" />,
  },
  {
    title: "URL Shortener",
    description:
      "Create clean, short links for any URL with custom domains support and click analytics.",
    icon: <LuLink2 className="h-5 w-5 text-primary" />,
  },
  {
    title: "Personal Bio",
    description:
      "Showcase your uploads with a customizable profile page featuring themes, banners, and social links.",
    icon: <LuUser className="h-5 w-5 text-primary" />,
  },
  {
    title: "API Access",
    description:
      "Integrate with our powerful API for programmatic uploads and URL shortening.",
    icon: <LuExternalLink className="h-5 w-5 text-primary" />,
  },
  {
    title: "European Privacy",
    description: "Based in Europe with full GDPR compliance for your privacy.",
    icon: <LuShield className="h-5 w-5 text-primary" />,
  },
  {
    title: "Community Driven",
    description:
      "Funded by donations and maintained by a passionate developer.",
    icon: <LuHeart className="h-5 w-5 text-primary" />,
  },
];

export function HomePageClient() {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  const installCommand = "curl https://anon.love/install | bash";

  const fetcher = (url: string) => fetch(url).then((r) => r.json());

  const { data: stats, isLoading } = useSWR<Stats>("/api/stats", fetcher, {
    refreshInterval: 300000,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "Installation command copied to clipboard.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        title: "Error",
        description: "Failed to copy command.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen py-8">
      <main className="flex-1 pt-24">
        <section className="w-full overflow-hidden relative min-h-[80vh] md:min-h-screen lg:min-h-1/2 pb-24 pt-8">
          <div className="container max-w-7xl mx-auto px-4 md:px-6 relative z-10">
            <div className="grid gap-6 lg:gap-12 items-center max-w-8xl mx-auto">
              <motion.div
                className="flex flex-col justify-center space-y-4 sm:space-y-6 text-center lg:text-left"
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
                    className="inline-block text-sm font-medium mb-2"
                  >
                    Now in Beta
                  </Badge>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                    AnonHost
                  </h1>
                  <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-[600px] mx-auto lg:mx-0">
                    Fast, easy image hosting without the hassle
                  </p>
                </motion.div>
                <motion.div
                  className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
                  variants={fadeIn}
                >
                  <Link href="/dashboard">
                    <Button
                      size="lg"
                      className="gap-2 w-full min-[400px]:w-auto cursor-pointer hover:bg-primary/80 transition-all"
                    >
                      Get Started
                      <LuArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/api">
                    <Button
                      size="lg"
                      variant="outline"
                      className="gap-2 w-full min-[400px]:w-auto cursor-pointer hover:bg-secondary/30"
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
                      className="gap-2 w-full min-[400px]:w-auto cursor-pointer hover:bg-secondary/30"
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
            className="absolute hidden sm:block 
            top-[23%] left-[40%] 
            md:top-[38%] md:left-[45%] 
            lg:top-[33%] lg:left-[50%] 
            xl:top-[28%] xl:left-[55%] 
            2xl:top-[23%] 2xl:left-[55%]
            w-full max-w-[280px] md:max-w-[320px] lg:max-w-md xl:max-w-lg 
            z-0"
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
                ease: "easeInOut",
              }}
              className="transform translate-y-[min(0px,var(--scroll-offset,0px))]"
            >
              <Card className="border-2 border-dashed shadow-xl bg-background/95 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-10">
                  <div className="rounded-full bg-primary/10 p-3 sm:p-4 mb-3 sm:mb-4">
                    <LuUpload className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </section>

        <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32">
          <motion.div
            className="container max-w-7xl mx-auto px-4 md:px-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                Trusted by users worldwide
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Join many of our users who trust AnonHost for their image
                hosting needs
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <motion.div
                className="relative p-6 rounded-xl bg-card border shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary/10 p-3">
                  <LuUser className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-4xl font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
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
                className="relative p-6 rounded-xl bg-card border shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary/10 p-3">
                  <LuImage className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-4xl font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
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
                className="relative p-6 rounded-xl bg-card border shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary/10 p-3">
                  <LuHardDrive className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-4xl font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                  {isLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    <CountUp
                      end={Math.max(0, stats?.storage || 0)}
                      duration={2.5}
                      separator=","
                      formattingFn={(value) =>
                        bytes(value, {
                          unitSeparator: " ",
                          decimalPlaces: 1,
                          fixedDecimals: true,
                        }) || "0 B"
                      }
                    />
                  )}
                </h3>
                <p className="text-muted-foreground mt-2">Storage Used</p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        <section className="w-full pb-0 md:pb-0 lg:pb-0 xl:pb-0 py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32">
          <motion.div
            className="container max-w-7xl mx-auto px-4 md:px-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="text-center mb-8 sm:mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 sm:mb-3">
                Why Choose AnonHost?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Our platform offers everything you need for seamless file
                hosting
              </p>
            </motion.div>

            <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-8xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-background rounded-xl p-4 sm:p-6 shadow-sm border"
                >
                  <div className="rounded-full bg-primary/10 p-2 sm:p-3 w-fit mb-3 sm:mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="w-full py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32">
          <motion.div
            className="container max-w-4xl mx-auto px-4 md:px-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="bg-muted/50 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <LuTerminal className="h-6 w-6 text-primary" />
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
              <CardContent className="p-4 sm:p-6 space-y-4">
                <p className="text-sm sm:text-base text-muted-foreground">
                  Install the AnonHost CLI with a single command:
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-muted rounded-md border">
                  <code className="flex-1 text-sm sm:text-base font-mono bg-transparent break-all">
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
                <p className="text-xs text-muted-foreground">
                  Requires curl and bash. The script will install{" "}
                  <code>anonhost</code> to <code>~/.local/bin</code> and check
                  dependencies.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        <section className="w-full pb-12 sm:pb-16 md:pb-20 lg:pb-24 xl:pb-32">
          <motion.div
            className="container max-w-7xl mx-auto px-4 md:px-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 lg:p-16 xl:p-20 relative overflow-hidden"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="grid gap-6 lg:gap-12 lg:grid-cols-2 items-center max-w-8xl mx-auto relative z-10">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 sm:mb-4">
                    Ready to get started?
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md">
                    Join thousands of users who trust AnonHost for their file
                    hosting needs.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      size="lg"
                      className="gap-2 w-full sm:w-auto cursor-pointer"
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
                      className="gap-2 w-full sm:w-auto cursor-pointer"
                      asChild
                    >
                      <Link href="/pricing">View Pricing</Link>
                    </Button>
                  </div>
                </div>
                <div className="hidden lg:flex justify-end">
                  <motion.div
                    className="relative"
                    initial={{ rotate: -5 }}
                    animate={{ rotate: 5 }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                      duration: 5,
                      ease: "easeInOut",
                    }}
                  >
                    <Card className="border shadow-lg w-80">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="h-2 w-20 bg-primary/20 rounded-full" />
                          <div className="h-2 w-full bg-muted rounded-full" />
                          <div className="h-2 w-full bg-muted rounded-full" />
                          <div className="h-2 w-3/4 bg-muted rounded-full" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>

              <div className="absolute -top-24 -right-24 w-48 sm:w-64 md:w-72 lg:w-96 h-48 sm:h-64 md:h-72 lg:h-96 bg-primary/5 rounded-full blur-2xl sm:blur-3xl z-0" />
              <div className="absolute -bottom-32 -left-32 w-64 sm:w-80 md:w-96 lg:w-[32rem] h-64 sm:h-80 md:h-96 lg:h-[32rem] bg-primary/5 rounded-full blur-2xl sm:blur-3xl z-0" />
            </motion.div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
