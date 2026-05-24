"use client";

import type React from "react";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/Layout/ThemeProvider";
import { Navbar } from "@/components/Layout/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import { NavbarProvider } from "@/components/Layout/NavbarContext";

export const Root = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <NavbarProvider>
              <div className="relative flex min-h-screen min-w-0 flex-col overflow-x-hidden">
                <Navbar />
                <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col justify-center px-4 sm:px-6 lg:px-8">
                  {children}
                </div>
                <footer className="w-full border-t px-4 py-4 sm:px-6 lg:px-8">
                  <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-4 text-xs text-muted-foreground">
                    <span>&copy; {new Date().getFullYear()} AnonHost</span>
                    <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
                    <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
                    <a href="https://ko-fi.com/qkeiran" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Support</a>
                    <a href="https://github.com/keiranst/anonhost" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
                  </div>
                </footer>
              </div>
            </NavbarProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
};
