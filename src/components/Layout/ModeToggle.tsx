'use client';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export function ModeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
        <Monitor className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </button>
    );
  }

  const nextTheme =
    theme === 'system'
      ? resolvedTheme === 'dark'
        ? 'light'
        : 'dark'
      : theme === 'dark'
        ? 'light'
        : 'system';

  const cycleLabel =
    theme === 'system'
      ? `Currently system (${resolvedTheme}) — next: ${resolvedTheme === 'dark' ? 'light' : 'dark'}`
      : theme === 'dark'
        ? 'Next: system'
        : 'Next: dark';

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      title={cycleLabel}
      aria-label={cycleLabel}
    >
      {theme === 'system' ? (
        <Monitor className="h-4 w-4" />
      ) : theme === 'dark' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </button>
  );
}
