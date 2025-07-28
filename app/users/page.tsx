"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Filter, Plus, Search, Users, Loader2 } from "lucide-react"
import Link from "next/link"
import { UserActions } from "@/components/user-actions"
import { useSession } from "next-auth/react"
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}
interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  isActive: boolean
  createdAt: Date
  role: {
    name: string
  }
  employee: any
}

export default function UsersPage() {
  // Pagination state
  const [page, setPage] = useState(1)
  const pageSize = 12
  function getPaginated(list: User[]) {
    return list.slice((page - 1) * pageSize, page * pageSize)
  }
  function getTotalPages(list: User[]) {
    return Math.max(1, Math.ceil(list.length / pageSize))
  }
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")


  useEffect(() => {
    let ignore = false;
    const fetchUsers = async () => {
      let attempts = 0;
      const maxAttempts = 3;
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
      while (attempts < maxAttempts) {
        try {
          setLoading(true);
          setError(null);
          const response = await fetch("/api/users").catch(() => null);
          if (response?.status === 401) {
            setError("Session expired. Please log in again.");
            setUsers([]);
            setLoading(false);
            return;
          }
          if (!response) {
            throw new Error("Network error. Please check your connection.");
          }
          if (!response.ok) {
            throw new Error("Failed to fetch users");
          }
          const data = await response.json();
          if (!ignore) setUsers(data);
          setLoading(false);
          return;
        } catch (err) {
          attempts++;
          if (attempts >= maxAttempts) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
            setUsers([]);
            setLoading(false);
            return;
          }
          await delay(1000 * attempts);
        }
      }
    };
    fetchUsers();
    return () => { ignore = true; };
  }, []);

  const filteredUsers = users.filter((user) => {
    const term = search.toLowerCase()
    return (
      user.firstName.toLowerCase().includes(term) ||
      user.lastName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      (user.phoneNumber ? user.phoneNumber.toLowerCase().includes(term) : false) ||
      user.role.name.toLowerCase().includes(term)
    )
  })
  const totalUsers = filteredUsers.length
  const activeUsers = filteredUsers.filter((user) => user.isActive).length
  const inactiveUsers = filteredUsers.filter((user) => !user.isActive).length

  if (loading) {
    return (
      <div className="flex flex-col">
        <header className="dashboard-header">
          <div className="flex items-center gap-2 font-semibold">
            <Users className="h-5 w-5" />
            User Management
          </div>
        </header>
        <div className="loading-spinner">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen p-2 sm:p-4 md:p-6 w-full max-w-7xl mx-auto">
        <header className="dashboard-header">
          <div className="flex items-center gap-2 font-semibold">
            <Users className="h-5 w-5" />
            User Management
          </div>
        </header>
        <div className="p-6">
          <div className="error-state">
            <p className="text-destructive font-medium">Error: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <header className="dashboard-header">
        <div className="flex items-center gap-2 font-semibold">
          <Users className="h-5 w-5" />
          User Management
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="w-[300px] pl-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button size="sm" asChild>
            <Link href="/users/new" prefetch={true} passHref>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Link>
          </Button>
        </div>
      </header>

      <div className="p-6">
        <div className="space-y-6 animate-fade-in">
          {/* User Statistics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="stat-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Total Users</p>
                    <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Active Users</p>
                    <p className="text-2xl font-bold text-foreground">{activeUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Inactive Users</p>
                    <p className="text-2xl font-bold text-foreground">{inactiveUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle>System Users</CardTitle>
              <CardDescription>Manage user accounts and permissions ({users.length} users)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="empty-state">
                          <Users className="h-12 w-12 text-muted-foreground" />
                          <p className="text-muted-foreground">No users found. Add your first user to get started.</p>
                          <Button asChild className="mt-4">
                            <Link href="/users/new" prefetch={true} passHref>Add First User</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    getPaginated(filteredUsers).map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                          <Link href={`/users/${user.id}`} className="hover:underline text-foreground">
                            {user.firstName} {user.lastName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-primary hover:underline cursor-pointer">{user.email}</TableCell>
                        <TableCell>{user.phoneNumber || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {user.role.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <UserActions user={user} currentUserRole={session?.user?.role || "Employee"} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        {/* Pagination Controls */}
        {getTotalPages(filteredUsers) > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Prev
            </Button>
            <span className="text-sm text-gray-700">
              Page {page} of {getTotalPages(filteredUsers)}
            </span>
            <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(getTotalPages(filteredUsers), p + 1))} disabled={page === getTotalPages(filteredUsers)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
