"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { changeEmail } from "@/lib/settings";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function EmailChangeSection() {
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsChangingEmail(true);

    try {
      await changeEmail(newEmail);
      toast({
        title: "Verification email sent",
        description:
          "Please check your new email address to confirm the change",
      });
      setNewEmail("");
    } catch (error) {
      console.error("Failed to change email:", error);
      toast({
        title: "Error",
        description: "Failed to update email address",
        variant: "destructive",
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  return (
    <motion.div className="space-y-2" variants={fadeIn}>
      <Label htmlFor="email">Email Address</Label>
      <p className="text-sm text-muted-foreground mb-2">
        Change your email address (requires verification)
      </p>
      <div className="flex gap-2">
        <Input
          id="email"
          type="email"
          placeholder="New email address"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <Button
          variant="outline"
          onClick={handleEmailChange}
          disabled={isChangingEmail}
        >
          {isChangingEmail ? "Changing..." : "Change"}
        </Button>
      </div>
    </motion.div>
  );
}
