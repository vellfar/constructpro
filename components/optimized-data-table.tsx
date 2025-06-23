"use client"

import type React from "react"
import { useMemo, useCallback, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import type { PaginatedResult } from "@/types/database"

interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: PaginatedResult<T>
  columns: Column<T>[]
  loading?: boolean
  onRefresh?: () => void
  onExport?: () => void
  searchPlaceholder?: string
  filters?: React.ReactNode
  actions?: React.ReactNode
}

export function OptimizedDataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  onRefresh,
  onExport,
  searchPlaceholder = "Search...",
  filters,
  actions,
}: DataTableProps<T>) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
  )

  const debouncedSearch = useDebounce(search, 500)

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (debouncedSearch) {
      params.set("search", debouncedSearch)
    } else {
      params.delete("search")
    }

    if (sortBy) {
      params.set("sortBy", sortBy)
      params.set("sortOrder", sortOrder)
    } else {
      params.delete("sortBy")
      params.delete("sortOrder")
    }

    params.set("page", "1") // Reset to first page when filters change

    router.push(`?${params.toString()}`, { scroll: false })
  }, [debouncedSearch, sortBy, sortOrder, router, searchParams])

  const handleSort = useCallback(
    (column: string) => {
      if (sortBy === column) {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
      } else {
        setSortBy(column)
        setSortOrder("asc")
      }
    },
    [sortBy, sortOrder],
  )

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("page", page.toString())
      router.push(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const handlePageSizeChange = useCallback(
    (pageSize: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("pageSize", pageSize)
      params.set("page", "1") // Reset to first page
      router.push(
        `?${params.toString()}\`, { scroll: false  '1') // Reset to first page
    router.push(\`?${params.toString()}`,
        { scroll: false },
      )
    },
    [router, searchParams],
  )

  const renderCell = useCallback((column: Column<T>, row: T) => {
    const value = column.key.includes(".")
      ? column.key.split(".").reduce((obj, key) => obj?.[key], row)
      : row[column.key as keyof T]

    return column.render ? column.render(value, row) : value
  }, [])

  const memoizedRows = useMemo(() => {
    return data.data.map((row, index) => (
      <TableRow key={index} className="hover:bg-muted/50">
        {columns.map((column, colIndex) => (
          <TableCell key={colIndex} className={column.className}>
            {renderCell(column, row)}
          </TableCell>
        ))}
      </TableRow>
    ))
  }, [data.data, columns, renderCell])

  const paginationInfo = useMemo(() => {
    const { page, pageSize, total, totalPages } = data.pagination
    const start = (page - 1) * pageSize + 1
    const end = Math.min(page * pageSize, total)
    return { start, end, total, totalPages, page }
  }, [data.pagination])

  return (
    <div className="space-y-4">
      {/* Header with search and actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          {filters && (
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {filters}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          {actions}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  className={`${column.className} ${column.sortable ? "cursor-pointer hover:bg-muted/50" : ""}`}
                  onClick={() => column.sortable && handleSort(column.key as string)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && sortBy === column.key && (
                      <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              memoizedRows
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Showing {paginationInfo.start} to {paginationInfo.end} of {paginationInfo.total} results
          </p>
          <Select value={data.pagination.pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => handlePageChange(1)} disabled={!data.pagination.hasPrev}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(paginationInfo.page - 1)}
            disabled={!data.pagination.hasPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-1">
            <span className="text-sm text-muted-foreground">Page</span>
            <Badge variant="outline">
              {paginationInfo.page} of {paginationInfo.totalPages}
            </Badge>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(paginationInfo.page + 1)}
            disabled={!data.pagination.hasNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(paginationInfo.totalPages)}
            disabled={!data.pagination.hasNext}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
