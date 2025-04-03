"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";

function VerifyForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const autoOtp = searchParams.get("otp");
  const [otp, setOtp] = useState(autoOtp || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleVerify = useCallback(async (e: React.FormEvent | null, code?: string) => {
    if (e) e.preventDefault();
    setIsVerifying(true);

    try {
      const type = searchParams.get("type");

      const result = await signIn("email-otp", {
        email,
        otp: code || otp,
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.url) {
        window.location.href = result.url;
      }

      if (type === "email-change") {
        const response = await fetch("/api/settings/email/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otp: code || otp }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to verify email change");
        }

        toast({
          title: "Email Changed",
          description: "Your email has been successfully updated",
        });

        window.location.href = "/settings";
        return;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Invalid or expired code, ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
      setIsVerifying(false);
    }
  }, [email, otp, searchParams, toast]);

  useEffect(() => {
    if (!email) {
      window.location.href = "/register";
      return;
    }

    if (autoOtp && autoOtp.length === 6) {
      handleVerify(null, autoOtp);
    }
  }, [email, autoOtp, handleVerify]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <motion.div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Enter Verification Code
          </h1>
          <p className="text-sm text-muted-foreground">
            We sent a code to {email}
          </p>
        </motion.div>
      </CardHeader>
      <CardContent>
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
            {isVerifying ? "Verifying..." : "Verify"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Suspense
          fallback={
            <Card className="w-full max-w-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              </CardContent>
            </Card>
          }
        >
          <VerifyForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
