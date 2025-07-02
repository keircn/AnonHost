"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Mail, MessageSquare, HelpCircle, ArrowRight } from "lucide-react";

const contactMethods = [
  {
    title: "Email Support",
    description: "Get in touch with our support team",
    icon: <Mail className="h-6 w-6" />,
    href: "mailto:support@mg.anon.love",
    external: true,
  },
  {
    title: "Discord Community",
    description: "Join our Discord server for rapid support",
    icon: <MessageSquare className="h-6 w-6" />,
    href: "https://discord.gg/jPxJ52GF3r",
    external: true,
  },
  {
    title: "Help Center",
    description: "Browse our documentation and guides",
    icon: <HelpCircle className="h-6 w-6" />,
    href: "/docs",
    external: false,
  },
];

const faqs = [
  {
    question: "What file types are supported?",
    answer:
      "We support most image formats (PNG, JPEG, GIF, WebP), videos, audio files, and documents. Each file must be under 50MB for free users and 100MB for premium users.",
  },
  {
    question: "How long are files stored?",
    answer:
      "Files are stored indefinitely as long as your account remains active. Premium users get priority storage and additional features.",
  },
  {
    question: "Is my content private?",
    answer:
      "Yes! By default, all uploads are private. You can choose to make specific files public by sharing their links.",
  },
  {
    question: "What are the upload limits?",
    answer:
      "Free users can upload up to 50MB per file and 500MB total storage. Premium users get increased limits of 100MB per file and 1GB storage.",
  },
  {
    question: "How do I get premium?",
    answer:
      "While billing is not yet implemented, you can contact me directly in the Discord server if you are interested",
  },
];

export function ContactPageClient() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <motion.div
              className="flex flex-col items-center justify-center space-y-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Need Help? We&apos;re Here
              </h1>
              <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Choose how you&apos;d like to get in touch. We&apos;re here to
                help with any questions about our services.
              </p>
            </motion.div>

            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
              {contactMethods.map((method, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link
                    href={method.href}
                    target={method.external ? "_blank" : undefined}
                  >
                    <Card className="h-full transition-colors hover:border-primary">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {method.icon}
                          {method.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {method.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="mx-auto max-w-3xl space-y-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tighter">
                  Frequently Asked Questions
                </h2>
                <p className="text-muted-foreground mt-2">
                  Find quick answers to common questions
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Still have questions? Check out our detailed documentation
                </p>
                <Link href="/api">
                  <Button variant="outline" className="gap-2">
                    View Documentation
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
