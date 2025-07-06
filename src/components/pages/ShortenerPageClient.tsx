'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link,
  ExternalLink,
  Copy,
  Trash2,
  Clock,
  BarChart,
} from 'lucide-react';

interface Shortlink {
  id: string;
  originalUrl: string;
  title: string | null;
  shortUrl: string;
  clicks: number;
  public: boolean;
  createdAt: string;
  expireAt: string | null;
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

export function ShortenerPageClient() {
  const { status } = useSession();
  const [shortlinks, setShortlinks] = useState<Shortlink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [expiresIn, setExpiresIn] = useState<string | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchShortlinks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/shortener');
        if (!response.ok) throw new Error('Failed to fetch shortlinks');
        const data = await response.json();
        setShortlinks(data.shortlinks || []);
      } catch (error) {
        console.error('Failed to fetch shortlinks:', error);
        toast.error('Error: Failed to fetch shortlinks');
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'unauthenticated') {
      redirect('/register');
    }

    if (status === 'authenticated') {
      fetchShortlinks();
    }
  }, [status, toast]);

  const handleCreateShortlink = async () => {
    if (!newUrl) {
      toast.error('URL required');
      return;
    }

    try {
      new URL(newUrl);
    } catch {
      toast.error('Invalid URL');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/shortener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: newUrl,
          title: newTitle || null,
          public: true,
          expiresIn: expiresIn,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create shortlink');
      }

      const newShortlink = await response.json();
      setShortlinks((prev) => [newShortlink, ...prev]);

      toast.success('Shortlink created');

      setNewUrl('');
      setNewTitle('');
      setExpiresIn(undefined);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create shortlink:', error);
      toast.error('Error: Failed to create shortlink');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteShortlink = async (id: string) => {
    try {
      const response = await fetch(`/api/shortener/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete shortlink');

      setShortlinks((prev) => prev.filter((link) => link.id !== id));

      toast.success('Shortlink deleted');
    } catch (error) {
      console.error('Failed to delete shortlink:', error);
      toast.error('Error: Failed to delete shortlink');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const renderContent = () => {
    if (status === 'loading') {
      return (
        <motion.div
          className="container flex min-h-[calc(100vh-4rem)] items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center">Loading...</div>
        </motion.div>
      );
    }

    return (
      <motion.div
        className="container py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="mb-6 flex items-center justify-between"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          <h1 className="text-3xl font-bold">URL Shortener</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Link className="mr-2 h-4 w-4" />
                Create Shortlink
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Shortlink</DialogTitle>
                <DialogDescription>
                  Enter the URL you want to shorten. You can optionally add a
                  title and set expiration.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="url">URL to shorten</Label>
                  <Input
                    id="url"
                    placeholder="https://example.com/very-long-url-that-needs-shortening"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="title">Title (optional)</Label>
                  <Input
                    id="title"
                    placeholder="My awesome link"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expires">Expires after</Label>
                  <Select
                    value={expiresIn}
                    onValueChange={(value) => setExpiresIn(value)}
                  >
                    <SelectTrigger id="expires">
                      <SelectValue placeholder="Never" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateShortlink} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Shortlink'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {isLoading ? (
            <motion.div className="py-8 text-center" variants={fadeIn}>
              Loading your shortlinks...
            </motion.div>
          ) : shortlinks.length === 0 ? (
            <motion.div variants={fadeIn}>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Link className="text-muted-foreground mb-4 h-12 w-12" />
                  <p className="text-muted-foreground mb-4">
                    You haven&apos;t created any shortlinks yet
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Link className="mr-2 h-4 w-4" />
                    Create Your First Shortlink
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <AnimatePresence>
              <div className="grid gap-4">
                {shortlinks.map((link) => (
                  <motion.div
                    key={link.id}
                    variants={fadeIn}
                    layout
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex flex-col space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="text-lg font-medium">
                                {link.title || 'Untitled Link'}
                              </h4>
                              <div className="text-muted-foreground flex items-center">
                                <BarChart className="mr-1 h-4 w-4" />
                                <span className="text-sm">
                                  {link.clicks} clicks
                                </span>
                                {link.expireAt && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <Clock className="mr-1 h-4 w-4" />
                                    <span className="text-sm">
                                      Expires:{' '}
                                      {new Date(
                                        link.expireAt
                                      ).toLocaleDateString()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => copyToClipboard(link.shortUrl)}
                                title="Copy shortlink"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  window.open(link.shortUrl, '_blank')
                                }
                                title="Open shortlink"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleDeleteShortlink(link.id)}
                                title="Delete shortlink"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid gap-2 text-sm">
                            {link.shortUrl ? (
                              <div className="flex flex-col">
                                <span className="font-medium">Short URL:</span>
                                <a
                                  href={link.shortUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {link.shortUrl}
                                </a>
                              </div>
                            ) : (
                              <></>
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium">Original URL:</span>
                              <span className="text-muted-foreground truncate">
                                {link.originalUrl}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </motion.div>
      </motion.div>
    );
  };

  return renderContent();
}
