"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LuArrowRight,
  LuCircleCheck,
  LuCode,
  LuCopy,
  LuExternalLink,
  LuHardDrive,
  LuImage,
  LuLink2,
  LuShield,
  LuSparkles,
  LuStar,
  LuTerminal,
  LuUsers,
} from "react-icons/lu";
import bytes from "bytes";
import useSWR from "swr";
import { Stats } from "@/types/stats";
import { PLAN_DETAILS } from "@/lib/plans";

const features = [
  {
    title: "Image Hosting",
    description:
      "Instant uploads with direct links, automatic previews, and excellent reliability.",
    icon: LuImage,
  },
  {
    title: "URL Shortener",
    description: "Create branded, readable short links with fast redirects and clean analytics.",
    icon: LuLink2,
  },
  {
    title: "CLI + API",
    description: "Automate uploads and link creation from scripts, terminals, and internal tools.",
    icon: LuCode,
  },
  {
    title: "Privacy First",
    description: "European hosting with straightforward policies and practical data protection.",
    icon: LuShield,
  },
];

const premiumFeatures = [
  "Up to 2GB per file",
  "Unlimited storage",
  "Direct-to-R2 uploads",
  "Custom domains",
  "Priority support",
];

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.max(0, value));
}

export function HomePageClient() {
  const [isCopied, setIsCopied] = useState(false);
  const installCommand = "curl https://anonhost.cc/install | bash";
  const fetcher = (url: string) => fetch(url).then((r) => r.json());
  const { data: stats, isLoading } = useSWR<Stats>("/api/stats", fetcher, {
    refreshInterval: 300000,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setIsCopied(true);
      toast.success("Install command copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
      toast.error("Failed to copy install command");
    }
  };

  return (
    <div className="text-foreground relative flex min-h-screen w-full flex-col bg-transparent">
      <main className="relative z-10 flex-1 pt-20 sm:pt-24">
        <section className="container mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <motion.div
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="space-y-6"
            >
              <div className="bg-card/80 text-muted-foreground inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm">
                Fast • Private • Free
              </div>

              <h1 className="text-foreground text-4xl leading-tight font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Upload, shorten, and share files in seconds.
              </h1>

              <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed sm:text-xl">
                AnonHost is a fast, practical platform for image hosting and URL shortening with a
                clean API and terminal-first workflow.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="group">
                  <Link href="/dashboard">
                    Open Dashboard
                    <LuArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/api">
                    API Docs
                    <LuExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.08, duration: 0.35, ease: "easeOut" }}
              className="relative"
            >
              <Card className="bg-card/85 border-border/70 relative overflow-hidden shadow-2xl backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground flex items-center gap-2 text-lg">
                    <span className="bg-primary/10 rounded-md p-1.5">
                      <LuUsers className="text-primary h-4 w-4" />
                    </span>
                    Instance Stats
                  </CardTitle>
                  <CardDescription>
                    Current scale across uploads, users, and total storage.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <StatRow
                    icon={LuUsers}
                    label="Registered users"
                    value={isLoading ? "..." : formatNumber(stats?.users ?? 0)}
                  />
                  <StatRow
                    icon={LuImage}
                    label="Total uploads"
                    value={isLoading ? "..." : formatNumber(stats?.uploads ?? 0)}
                  />
                  <StatRow
                    icon={LuHardDrive}
                    label="Storage used"
                    value={
                      isLoading
                        ? "..."
                        : bytes(Math.max(0, stats?.storage ?? 0), {
                          unitSeparator: " ",
                          decimalPlaces: 1,
                          fixedDecimals: true,
                        }) || "0 B"
                    }
                  />
                </CardContent>
              </Card>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3, ease: "easeOut" }}
                className="bg-card/90 text-muted-foreground border-border/70 absolute -top-7 -right-4 hidden rounded-xl border px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-sm md:block"
              >
                Fast uploads. Clean links.
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="container mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: index * 0.05, duration: 0.28 }}
                >
                  <Card className="bg-card/85 card border-border/70 hover:border-primary/40 hover:bg-card h-full shadow-md transition-colors">
                    <CardHeader className="pb-3">
                      <div className="bg-muted text-muted-foreground mb-2 w-fit rounded-lg p-2">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        <motion.section
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-70px" }}
          transition={{ duration: 0.32 }}
          className="container mx-auto max-w-7xl px-4 py-14 md:px-6"
          hidden
        >
          <Card className="bg-card/85 border-border/70 overflow-hidden shadow-md backdrop-blur-sm">
            <CardContent className="relative flex flex-col items-start gap-6 p-7 sm:p-10 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl space-y-3 flex-1">
                <div className="flex items-center gap-2 text-primary">
                  <LuSparkles className="h-5 w-5" />
                  <span className="text-sm font-medium uppercase tracking-wide">Premium</span>
                </div>
                <h2 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
                  Unlock More with Premium
                </h2>
                <p className="text-muted-foreground text-base leading-relaxed">
                  Get higher limits, faster uploads, custom domains, and priority support. Plus, you
                  help keep the project sustainable.
                </p>
                <ul className="space-y-1 pt-2">
                  {premiumFeatures.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm">
                      <LuCircleCheck className="h-4 w-4 text-green-500" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:self-end sm:items-end">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/pricing">
                    View Plans
                    <LuArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-70px" }}
          transition={{ duration: 0.32 }}
          className="container mx-auto max-w-7xl px-4 py-14 md:px-6"
        >
          <Card className="bg-card/90 border-border/70 overflow-hidden shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-foreground flex items-center gap-2 text-2xl">
                <LuTerminal className="text-muted-foreground h-6 w-6" />
                CLI in one command
              </CardTitle>
              <CardDescription>
                Install AnonHost CLI and start uploading from your terminal.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 p-6">
              <div className="bg-muted flex flex-col items-stretch gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-3">
                <code className="text-foreground flex-1 font-mono text-sm sm:text-base">
                  {installCommand}
                </code>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleCopy}
                  aria-label="Copy install command"
                  className="shrink-0"
                >
                  {isCopied ? (
                    <LuCircleCheck className="h-4 w-4" />
                  ) : (
                    <LuCopy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <p className="text-muted-foreground text-sm">
                Requires cURL and bash, installs anonhost into $HOME/.local/bin
              </p>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-70px" }}
          transition={{ duration: 0.32 }}
          className="container mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24"
        >
          <Card className="bg-card border-border/70 relative overflow-hidden shadow-2xl">
            <CardContent className="relative flex flex-col items-start gap-6 p-7 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <h2 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
                  Ready to ship your first link?
                </h2>
                <p className="text-muted-foreground text-base">
                  Create an account in under a minute and start uploading, shortening, and sharing
                  right away.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/register">
                    Create Free Account
                    <LuArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </main>
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof LuUsers;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-muted/45 flex items-center justify-between rounded-lg border px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="bg-muted text-muted-foreground rounded-md p-2">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-muted-foreground text-sm">{label}</span>
      </div>
      <span className="text-foreground text-lg font-semibold">{value}</span>
    </div>
  );
}

