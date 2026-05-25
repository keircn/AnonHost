'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { changeEmail } from '@/lib/settings';

export function EmailChangeSection() {
  const [newEmail, setNewEmail] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Invalid email: Please enter a valid email address');
      return;
    }

    setIsChangingEmail(true);

    try {
      await changeEmail(newEmail);
      toast.success(
        'Verification email sent: Please check your new email address to confirm the change'
      );
      setNewEmail('');
    } catch (error) {
      console.error('Failed to change email:', error);
      toast.error('Error: Failed to change email');
    } finally {
      setIsChangingEmail(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email Address</Label>
      <p className="text-muted-foreground mb-2 text-sm">
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
          {isChangingEmail ? 'Changing...' : 'Change'}
        </Button>
      </div>
    </div>
  );
}
