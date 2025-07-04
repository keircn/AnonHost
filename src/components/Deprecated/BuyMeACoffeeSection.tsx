"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { verifyBuyMeACoffeeMembership } from "@/lib/settings";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function BuyMeACoffeeSection() {
  const { toast } = useToast();
  const [bmcEmail, setBmcEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyMembership = async () => {
    if (!bmcEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your BuyMeACoffee email address",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyBuyMeACoffeeMembership(bmcEmail);

      if (result.subscribed) {
        toast({
          title: "Premium Activated",
          description:
            "Your membership has been verified and Premium access granted.",
        });
        setBmcEmail("");
      } else if (result.code === "EMAIL_ALREADY_USED") {
        toast({
          title: "Email Already Used",
          description:
            "This BuyMeACoffee email is already linked to another account",
          variant: "destructive",
        });
      } else {
        toast({
          title: "No Active Membership",
          description:
            "We couldn't find an active membership for this email address.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <motion.div className="space-y-2" variants={fadeIn}>
      <Label>BuyMeACoffee Membership</Label>
      <p className="text-sm text-muted-foreground mb-2">
        Support the project with a monthly membership via BuyMeACoffee to get
        Premium access.
      </p>

      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          onClick={handleVerifyMembership}
          disabled={isVerifying}
        >
          Check Membership Status
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or verify with different email
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Enter your BuyMeACoffee email"
            value={bmcEmail}
            onChange={(e) => setBmcEmail(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={handleVerifyMembership}
            disabled={isVerifying}
          >
            Verify
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
