'use client';

import type React from 'react';
import '@/app/globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/Layout/ThemeProvider';
import { Navbar } from '@/components/Layout/Navbar';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/Auth/AuthProvider';
import { NavbarProvider } from '@/components/Layout/NavbarContext';
import { GridPattern } from '@/components/magicui/grid-pattern';

const inter = Inter({ subsets: ['latin'] });

export const Root = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <NavbarProvider>
              <div className="relative flex min-h-screen flex-col">
                <Navbar />
                <GridPattern className="text-muted-foreground pointer-events-none absolute inset-0 z-0 opacity-10" />
                <div className="mx-auto flex w-full max-w-[2000px] flex-1 justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
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
