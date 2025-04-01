"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, Shield, Code } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full pt-12 md:pt-12 md:pb-24 lg:pt-16 lg:pb-16">
          <div className="container px-4 mt-[15vh] mb-36 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl">
                    AnonHost
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Fast, easy image hosting without the hassle
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/dashboard">
                    <Button size="lg" className="gap-1.5">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/api">
                    <Button size="lg" variant="outline" className="gap-1.5">
                      API Documentation
                      <Code className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <motion.div
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="border border-border w-full h-full flex items-center justify-center">
                  <Upload className="h-24 w-24 text-white opacity-80" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Features
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Everything you need to manage and share your images
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <motion.div
                className="grid gap-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Upload className="h-8 w-8 mb-2 text-primary" />
                <h3 className="text-xl font-bold">Easy Uploads</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Drag and drop or select files to upload instantly
                </p>
              </motion.div>
              <motion.div
                className="grid gap-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Shield className="h-8 w-8 mb-2 text-primary" />
                <h3 className="text-xl font-bold">Secure Storage</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Your images are stored securely and accessible only to you
                </p>
              </motion.div>
              <motion.div
                className="grid gap-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Code className="h-8 w-8 mb-2 text-primary" />
                <h3 className="text-xl font-bold">API Access</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Generate API keys and integrate with your applications
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
