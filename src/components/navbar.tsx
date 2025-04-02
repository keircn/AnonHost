"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { signOut, useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  interface NavLink {
    href: string;
    label: string;
  }

  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavigationLinks = () => (
    <>
      {[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/upload", label: "Upload" },
        { href: "/api", label: "API" },
        { href: "/privacy", label: "Privacy" },
        session?.user?.admin && { href: "/admin", label: "Admin" },
      ]
        .filter(Boolean)
        .map((link: NavLink) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 transition-colors hover:text-foreground/80 rounded-md hover:bg-accent ${
              pathname === link.href
                ? "text-foreground bg-accent"
                : "text-foreground/60"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-blur:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center px-3">
            <span className="font-bold text-lg">AnonHost</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavigationLinks />
          </nav>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-4">
          <ModeToggle />

          <div className="hidden md:block">
            {isLoading ? (
              <Button variant="ghost" size="sm" disabled>
                Loading...
              </Button>
            ) : isAuthenticated ? (
              <UserMenu session={session} />
            ) : (
              <Link href="/register">
                <Button size="sm" className="px-4">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container py-4">
            <NavigationLinks />
            {!isAuthenticated && (
              <div className="mt-4 pt-4 border-t">
                <Link href="/register" className="block">
                  <Button className="w-full">Sign In</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function UserMenu({ session }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={session?.user?.image || ""}
              alt={session?.user?.name || ""}
            />
            <AvatarFallback>
              {session?.user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex flex-col p-2">
          <p className="text-sm font-medium">{session?.user?.name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {session?.user?.email}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/upload" className="cursor-pointer flex w-full">
            <Upload className="mr-2 h-4 w-4" />
            <span>Upload</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer flex w-full">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
