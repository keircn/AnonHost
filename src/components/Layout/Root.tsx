"use client";

import type React from "react";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/Layout/ThemeProvider";
import { Navbar } from "@/components/Layout/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import { NavbarProvider } from "@/components/Layout/NavbarContext";
import { ThemeProvider as RetroThemeProvider, defaultTheme } from "retro-react";

const retroTheme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    primary: "#000000",
    secondary: "#808080",
    success: "#000000",
    error: "#000000",
    warn: "#555555",
    text: "#000000",
    greyscale: "#808080",
    "greyscale-dark": "#555555",
    none: "transparent",
  },
  shades: {
    shade1: "#ffffff",
    shade2: "#d8d8d8",
    shade3: "#9a9a9a",
    shade4: "#555555",
    shade5: "#202020",
    shade6: "#000000",
  },
  gui: {
    buttonFace: "#c0c0c0",
    buttonShadow: "#808080",
    buttonHighlight: "#ffffff",
    windowBackground: "#d8d8d8",
  },
  terminal: {
    background: "#ffffff",
    foreground: "#000000",
  },
};

export const Root = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
        >
          <RetroThemeProvider theme={retroTheme}>
            <AuthProvider>
              <NavbarProvider>
                <div className="relative flex min-h-screen min-w-0 flex-col overflow-x-hidden">
                  <Navbar />
                  <div className="mx-auto flex w-full min-w-0 max-w-[2000px] flex-1 justify-center px-2 sm:px-4 lg:px-6">
                    {children}
                  </div>
                </div>
              </NavbarProvider>
            </AuthProvider>
          </RetroThemeProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
};
