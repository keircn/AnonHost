"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface User {
  id: string;
  name: string;
  email: string;
  premium: boolean;
  admin: boolean;
  createdAt: string;
  _count: {
    Media: number;
    Shortlink: number;
    apiKeys: number;
  };
  settings?: {
    customDomain: string | null;
  };
}

interface EmailFormData {
  subject: string;
  message: string;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (
    id: string,
    data: { premium?: boolean; admin?: boolean }
  ) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });

      if (!response.ok) throw new Error("Failed to update user");

      setUsers(
        users.map((user) => (user.id === id ? { ...user, ...data } : user))
      );

      toast({
        title: "Success",
        description: "User updated successfully",
      });
    } catch (error) {
      console.error("Failed to update user:", error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const sendEmail = async (formData: EmailFormData) => {
    setIsEmailSending(true);
    try {
      const response = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedUser?.email,
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send email");
      }

      toast({
        title: "Email Sent",
        description: `Successfully sent email to ${selectedUser?.email}`,
      });
      setIsDialogOpen(false);
    } catch (error: Error | unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send email";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsEmailSending(false);
    }
  };

  useEffect(() => {
    if (!session?.user?.admin) {
      redirect("/");
    }
    fetchUsers();
  }, [session]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="stats">System Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user permissions and view statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Images</TableHead>
                    <TableHead>API Keys</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user._count.Media}</TableCell>
                      <TableCell>{user._count.apiKeys}</TableCell>
                      <TableCell>
                        {user.settings?.customDomain || "—"}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={user.premium}
                          onCheckedChange={(checked) =>
                            updateUser(user.id, { premium: checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={user.admin}
                          onCheckedChange={(checked) =>
                            updateUser(user.id, { admin: checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Dialog
                          open={isDialogOpen}
                          onOpenChange={setIsDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              Email
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Send Email to {selectedUser?.email}
                              </DialogTitle>
                            </DialogHeader>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                sendEmail({
                                  subject: formData.get("subject") as string,
                                  message: formData.get("message") as string,
                                });
                              }}
                              className="space-y-4"
                            >
                              <Input
                                name="subject"
                                placeholder="Email subject"
                                required
                                disabled={isEmailSending}
                              />
                              <Textarea
                                name="message"
                                placeholder="Email message"
                                required
                                rows={5}
                                disabled={isEmailSending}
                              />
                              <Button type="submit" disabled={isEmailSending}>
                                {isEmailSending ? "Sending..." : "Send Email"}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Premium Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {users.filter((u) => u.premium).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {users.reduce((acc, user) => acc + user._count.Media, 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
