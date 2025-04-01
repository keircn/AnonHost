"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Upload, ExternalLink, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const staggerChildren = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
}

const features = [
  {
    title: "Lightning Fast",
    description: "Upload and share your files with blazing speed and reliability.",
    icon: <ArrowRight className="h-5 w-5 text-primary" />,
  },
  {
    title: "Secure Storage",
    description: "Your files are encrypted and stored securely on our servers.",
    icon: <CheckCircle className="h-5 w-5 text-primary" />,
  },
  {
    title: "API Access",
    description: "Integrate with our powerful API for programmatic uploads.",
    icon: <ExternalLink className="h-5 w-5 text-primary" />,
  },
]

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full pt-16 md:pt-24 lg:pt-32 overflow-hidden relative min-h-screen">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              <motion.div
                className="flex flex-col justify-center space-y-6"
                variants={staggerChildren}
                initial="initial"
                animate="animate"
              >
                <motion.div className="space-y-4" variants={fadeIn}>
                  <Badge variant="secondary" className="text-sm font-medium">
                    Now in Beta
                  </Badge>
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                    AnonHost
                  </h1>
                  <p className="max-w-[600px] text-xl text-muted-foreground md:text-2xl">
                    Fast, easy image hosting without the hassle
                  </p>
                </motion.div>
                <motion.div className="flex flex-col gap-3 min-[400px]:flex-row" variants={fadeIn}>
                  <Link href="/dashboard">
                    <Button size="lg" className="gap-2 w-full min-[400px]:w-auto">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/api">
                    <Button size="lg" variant="outline" className="gap-2 w-full min-[400px]:w-auto">
                      API Documentation
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>

          <motion.div
            className="absolute top-[50%] right-[-5%] lg:right-[5%] w-full max-w-md z-0 transform rotate-6 lg:rotate-12"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="border-2 border-dashed shadow-xl bg-background/95 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center p-10 pr-12">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <Upload className="h-12 w-12 text-primary" />
                </div>
                <p className="text-md font-bold text-muted-foreground text-center">
                  We support images, videos, audio and more!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        <section className="w-full py-20 min-h-screen">
          <motion.div
            className="container px-4 md:px-6"
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
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold tracking-tight">Why Choose AnonHost?</h2>
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
                Our platform offers everything you need for seamless file hosting
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-background rounded-xl p-6 shadow-sm border"
                >
                  <div className="rounded-full bg-primary/10 p-3 w-fit mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="w-full pb-20">
          <motion.div
            className="container px-4 md:px-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="rounded-2xl p-8 md:p-12 relative overflow-hidden"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="grid gap-6 lg:grid-cols-2 items-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight mb-4">Ready to get started?</h2>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Join thousands of users who trust AnonHost for their file hosting needs. Sign up today and get
                    started in minutes.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/dashboard">
                      <Button size="lg" className="gap-2 w-full sm:w-auto">
                        Create Free Account
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/pricing">
                      <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                        View Pricing
                      </Button>
                    </Link>
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

              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
            </motion.div>
          </motion.div>
        </section>
      </main>
    </div>
  )
}