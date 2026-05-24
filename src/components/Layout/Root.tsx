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
                <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 justify-center px-4 sm:px-6 lg:px-8">
                  {children}
                </div>
              </div>
            </NavbarProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
};
