"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LuCheck, LuSparkles } from "react-icons/lu";
import Link from "next/link";
import { PLAN_DETAILS, getPremiumCheckoutUrls } from "@/lib/plans";

const { free, premium } = PLAN_DETAILS;

export function PricingPageClient() {
  const checkoutUrls = getPremiumCheckoutUrls();

  return (
    <div className="container mx-auto max-w-6xl space-y-12 py-16 md:mt-24">
      <motion.div
        className="space-y-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground text-lg">Choose the plan that works for you</p>
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
                {free.badge}
              </Badge>
              <CardTitle className="text-2xl">{free.name}</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{free.priceLabel}</span>
                <span className="text-muted-foreground">{free.intervalLabel}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {free.features.map((feature, i) => (
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
            <div className="bg-primary text-primary-foreground absolute top-0 right-0 rounded-bl px-3 py-1 text-sm flex items-center gap-1">
              <LuSparkles className="h-3 w-3" />
              Popular
            </div>
            <CardHeader className="space-y-1">
              <Badge variant="default" className="bg-primary w-fit">
                {premium.badge}
              </Badge>
              <CardTitle className="text-2xl">{premium.name}</CardTitle>
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{premium.monthlyPriceLabel}</span>
                  <span className="text-muted-foreground">{premium.monthlyIntervalLabel}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-semibold">{premium.yearlyPriceLabel}</span>
                  <span className="text-muted-foreground">{premium.yearlyIntervalLabel}</span>
                  <Badge variant="outline" className="ml-1 text-green-500 border-green-500">
                    {premium.savingsLabel}
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground text-sm pt-1">{premium.heroSubtitle}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {premium.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <LuCheck className="text-primary h-4 w-4" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <div className="grid w-full gap-2 sm:grid-cols-2">
                {checkoutUrls.monthly && (
                  <Button asChild>
                    <Link href={checkoutUrls.monthly} target="_blank" rel="noopener">
                      Monthly
                    </Link>
                  </Button>
                )}
                {checkoutUrls.yearly && (
                  <Button asChild variant="secondary">
                    <Link href={checkoutUrls.yearly} target="_blank" rel="noopener">
                      Yearly
                    </Link>
                  </Button>
                )}
                {!checkoutUrls.monthly && !checkoutUrls.yearly && (
                  <Button asChild className="sm:col-span-2">
                    <Link href="https://ko-fi.com/qkeiran" target="_blank" rel="noopener">
                      Join Waitlist
                    </Link>
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground text-center text-sm">
                Questions? Reach out on{" "}
                <a
                  href="https://discord.gg/jPxJ52GF3r"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Discord
                </a>
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
          All plans include GDPR compliance, EU hosting, and 99.9% uptime guarantee.
          <br />
          Cancel anytime. No questions asked.
        </p>
      </motion.div>
    </div>
  );
}