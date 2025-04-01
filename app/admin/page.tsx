"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"

interface User {
  id: string
  name: string
  email: string
  premium: boolean
  admin: boolean
  createdAt: string
  _count: {
    images: number
    apiKeys: number
  }
  settings?: {
    customDomain: string | null
  }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateUser = async (id: string, data: { premium?: boolean; admin?: boolean }) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      })
      
      if (!response.ok) throw new Error("Failed to update user")
      
      setUsers(users.map(user => 
        user.id === id ? { ...user, ...data } : user
      ))

      toast({
        title: "Success",
        description: "User updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (!session?.user?.admin) {
      redirect("/")
    }
    fetchUsers()
  }, [session])

  if (isLoading) {
    return <div>Loading...</div>
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
              <CardDescription>Manage user permissions and view statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Images</TableHead>
                    <TableHead>API Keys</TableHead>
                    <TableHead>Custom Domain</TableHead>
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
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{user._count.images}</TableCell>
                      <TableCell>{user._count.apiKeys}</TableCell>
                      <TableCell>{user.settings?.customDomain || "—"}</TableCell>
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
                  {users.filter(u => u.premium).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {users.reduce((acc, user) => acc + user._count.images, 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}