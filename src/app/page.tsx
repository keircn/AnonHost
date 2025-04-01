"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, Shield, Code } from "lucide-react";
import { motion } from "framer-motion";

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
    icon: Upload,
    title: "Easy Uploads",
    description: "Drag and drop or select files to upload instantly",
  },
  {
    icon: Shield,
    title: "Secure Storage",
    description: "Your images are stored securely and accessible only to you",
  },
  {
    icon: Code,
    title: "API Access",
    description: "Generate API keys and integrate with your applications",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full pt-12 md:pt-12 md:pb-24 lg:pt-16 lg:pb-16">
          <div className="container px-4 mt-[15vh] mb-36 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <motion.div
                className="flex flex-col justify-center space-y-4"
                variants={staggerChildren}
                initial="initial"
                animate="animate"
              >
                <motion.div className="space-y-2" variants={fadeIn}>
                  <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl">
                    AnonHost
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Fast, easy image hosting without the hassle
                  </p>
                </motion.div>
                <motion.div
                  className="flex flex-col gap-2 min-[400px]:flex-row"
                  variants={fadeIn}
                >
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
                </motion.div>
              </motion.div>
              <motion.div
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <motion.div
                  className="border border-border w-full h-full flex items-center justify-center"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Upload className="h-24 w-24 text-foreground opacity-80" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <motion.div
              className="flex flex-col items-center justify-center space-y-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Features
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Everything you need to manage and share your images
                </p>
              </div>
            </motion.div>
            <motion.div
              className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12"
              variants={staggerChildren}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  className="grid gap-1"
                  variants={fadeIn}
                >
                  <feature.icon className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
