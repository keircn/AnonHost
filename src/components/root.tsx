"use client";

import type React from "react";
import "@/app/globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth-provider";
import { GridPattern } from "@/components/magicui/grid-pattern";
import { NavbarProvider } from '@/components/NavbarContext';

const inter = Inter({ subsets: ["latin"] });

export const Root = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <GridPattern
                className="absolute inset-0 z-0 opacity-10"
                width={50}
                height={50}
                color="bg-accent"
              />
              <NavbarProvider>
                <Navbar />
              </NavbarProvider>
              <div className="flex-1 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 max-w-[2000px] mx-auto w-full">
                {children}
              </div>
            </div>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
};
