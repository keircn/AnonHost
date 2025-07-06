'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';

function LoadingCard() {
  return (
    <Card className="p-8">
      <div className="flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    </Card>
  );
}

export function VerifyPageClient() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Suspense fallback={<LoadingCard />}>
          <VerifyForm />
        </Suspense>
      </motion.div>
    </div>
  );
}

function VerifyForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      const verifyResponse = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        throw new Error(data.error || 'Verification failed');
      }

      const result = await signIn('email-login', {
        email,
        otp,
        redirect: false,
        callbackUrl: '/dashboard',
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      setIsVerifying(false);
      let message = 'Verification failed';
      if (error instanceof Error) message = error.message;
      toast(
        <div>
          <strong>Verification failed</strong>
          <div>{message}</div>
        </div>
      );
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (!email) {
      window.location.href = '/register';
    }
  }, [email]);

  return (
    <Card>
      <CardHeader>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-2 text-center"
        >
          <h1 className="text-2xl font-bold tracking-tight">
            Verify Your Email
          </h1>
          <p className="text-muted-foreground text-sm">
            We sent a code to {email}
          </p>
        </motion.div>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter verification code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />
            <Button
              className="w-full"
              type="submit"
              disabled={isVerifying || otp.length !== 6}
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </Button>
          </form>
        </motion.div>
      </CardContent>
    </Card>
  );
}
