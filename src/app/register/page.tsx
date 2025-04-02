"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FaDiscord as Discord } from "react-icons/fa6";

export default function RegisterPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2 text-center"
            >
              <h1 className="text-2xl font-bold tracking-tight">
                Create an Account or Login
              </h1>
              <p className="text-sm text-muted-foreground">
                Join thousands of users already using AnonHost
              </p>
            </motion.div>
          </CardHeader>
          <CardContent>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase mt-4">
                  <span className="bg-background px-2 text-muted-foreground">
                    Continue with
                  </span>
                </div>
              </div>

              <div className="flex justify-center my-8">
                <Button
                  className="w-full max-w-64 gap-2"
                  size="lg"
                  onClick={() =>
                    signIn("discord", { callbackUrl: "/dashboard" })
                  }
                >
                  <Discord className="h-5 w-5" />
                  Authenticate with Discord
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </div>

              <p className="px-8 text-center text-sm text-muted-foreground">
                By clicking continue, you agree to our{" "}
                <Link
                  href="/terms"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
