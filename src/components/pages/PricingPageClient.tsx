"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LuCheck, LuCoffee } from "react-icons/lu";
import Link from "next/link";

const features = {
  free: [
    "Up to 100MB per file",
    "1GB total storage",
    "Image optimization & conversion",
    "Video compression",
    "URL shortening",
    "Custom profile page",
    "Basic API access",
    "Community support",
  ],
  premium: [
    "Everything in Free, plus:",
    "Up to 500MB per file",
    "Unlimited storage",
    "Priority storage allocation",
    "Custom domains",
    "Advanced file processing",
    "Premium API features",
    "Priority support",
    "Early access to new features",
    "Support development",
  ],
};

export function PricingPageClient() {
  return (
    <div className="container max-w-6xl py-16 space-y-12 mx-auto md:mt-24">
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold">Simple, Transparent Pricing</h1>
        <p className="text-lg text-muted-foreground">
          Choose the plan that works for you
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader className="space-y-1 mb-6">
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
                    <LuCheck className="h-4 w-4 text-primary" />
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
          <Card className="h-full relative overflow-hidden border-primary">
            <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-sm rounded">
              Popular
            </div>
            <CardHeader className="space-y-1">
              <Badge variant="default" className="w-fit bg-primary">
                Premium
              </Badge>
              <CardTitle className="text-2xl">Supporter</CardTitle>
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">$5</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  or $50/year (save $10)
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {features.premium.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <LuCheck className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Link href="https://buymeacoffee.com/keiran/membership" target="_blank" rel="noopener noreferrer" className="w-full">
                <Button className="w-full" asChild>
                  <span>Subscribe</span>
                </Button>
                </Link>
                <p className="text-sm text-muted-foreground text-center">
                Join our{" "}
                <a
                  href="https://discord.gg/WZJksYs8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary"
                >
                  Discord
                </a>{" "}
                for more info
                </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      <motion.div
        className="text-center text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <p>
          All plans include GDPR compliance, EU hosting, and 99.9% uptime guarantee.
          <br />
          Currently in open beta - some features may be limited or unavailable.
        </p>
      </motion.div>
    </div>
  );
}
