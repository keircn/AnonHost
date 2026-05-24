"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Upload, Settings, LogOut, Menu, X, ExternalLink, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavbar } from "@/components/Layout/NavbarContext";
import { Logo } from "@/components/Brand/Logo";
import { ModeToggle } from "@/components/Layout/ModeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { showNavbar } = useNavbar();

  if (!showNavbar) return null;

  const navLinks = [
    ...(isAuthenticated ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    ...(isAuthenticated ? [{ href: "/upload", label: "Upload" }] : []),
    ...(isAuthenticated ? [{ href: "/shortener", label: "Shortener" }] : []),
    { href: "/api", label: "API" },
    ...(session?.user?.admin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={cn(
          "px-3 py-2 text-sm font-medium transition-colors rounded-md",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-accent",
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <Logo variant="svg" size="sm" />
            <span className="font-bold text-base tracking-tight">AnonHost</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <ModeToggle />

          <div className="hidden md:block">
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                    {session?.user?.name?.charAt(0)?.toUpperCase() || <User className="size-4" />}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/upload" className="flex items-center gap-2 cursor-pointer">
                      <Upload className="size-4" />
                      <span>Upload</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="size-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => signOut({ callbackUrl: "/" })}>
                    <LogOut className="size-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/register"
                className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Sign In
              </Link>
            )}
          </div>

          <button
            className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t md:hidden bg-background animate-slide-down">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {navLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
            <div className="mt-3 border-t pt-3 space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 text-sm">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {session?.user?.name?.charAt(0)?.toUpperCase() || <User className="size-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{session?.user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="size-4" />
                    Settings
                  </Link>
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="size-4" />
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <a
                    href="https://ko-fi.com/qkeiran"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    Support Us
                    <ExternalLink className="size-4" />
                  </a>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
