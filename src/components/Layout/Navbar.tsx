'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/Layout/ModeToggle';
import { ChatBot } from '@/components/Layout/ChatBot';
import { signOut, useSession } from 'next-auth/react';
import { UserMenuProps } from '@/types/user-menu-props';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Settings, LogOut, Menu, X, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useNavbar } from '@/components/Layout/NavbarContext';

export function Navbar() {
  interface NavLink {
    href: string;
    label: string;
  }

  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { showNavbar } = useNavbar();

  if (!showNavbar) return null;

  const NavigationLinks = () => (
    <>
      {[
        isAuthenticated && { href: '/dashboard', label: 'Dashboard' },
        isAuthenticated && { href: '/upload', label: 'Upload' },
        isAuthenticated && { href: '/shortener', label: 'Shortener' },
        { href: '/api', label: 'API' },
        session?.user?.admin && { href: '/admin', label: 'Admin' },
      ]
        .filter((link): link is NavLink => Boolean(link))
        .map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`hover:text-foreground/80 hover:bg-accent rounded-md px-3 py-2 transition-colors ${
              pathname === link.href
                ? 'text-foreground bg-accent'
                : 'text-foreground/60'
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}
    </>
  );

  return (
    <header className="bg-background/95 supports-backdrop-blur:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-7xl items-center px-4 xl:px-8 2xl:px-16">
        <div className="flex items-center gap-6 lg:gap-8">
          <Link
            href="/"
            className="-ml-3 flex items-center px-3 lg:-ml-4 lg:px-4"
          >
            <span className="hover:text-foreground/75 text-lg font-bold transition-colors lg:text-xl">
              AnonHost
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex lg:gap-2">
            <NavigationLinks />
          </nav>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-4 lg:gap-6">
          <a
            href="https://ko-fi.com/qkeiran"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:block"
          >
            <Button variant="outline" size="sm" className="gap-2">
              Support Us
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
          <ChatBot />
          <ModeToggle />

          <div className="hidden md:block">
            {isLoading ? (
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="lg:text-base"
              >
                Loading...
              </Button>
            ) : isAuthenticated ? (
              <UserMenu session={session} />
            ) : (
              <Link href="/register">
                <Button size="sm" className="px-4 lg:px-6 lg:py-3 lg:text-base">
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

      {isMobileMenuOpen && (
        <div className="bg-background border-t md:hidden">
          <nav className="container py-4">
            <NavigationLinks />
            {!isAuthenticated ? (
              <div className="mt-4 space-y-4 border-t pt-4">
                <Link href="/register" className="block">
                  <Button className="w-full">Sign In</Button>
                </Link>
                <a
                  href="https://ko-fi.com/qkeiran"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full gap-2">
                    Support Us
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            ) : null}
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
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full lg:h-10 lg:w-10"
        >
          <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
            <AvatarImage
              src={session?.user?.image || ''}
              alt={session?.user?.name || ''}
            />
            <AvatarFallback>
              {session?.user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 lg:w-64" align="end" forceMount>
        <div className="flex flex-col p-2 lg:p-3">
          <p className="text-sm font-medium lg:text-base">
            {session?.user?.name}
          </p>
          <p className="text-muted-foreground mt-1 text-xs lg:text-sm">
            {session?.user?.email}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/upload" className="flex w-full cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            <span>Upload</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex w-full cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
