"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"

interface UseRealTimeDataOptions<T> {
  endpoint: string
  refreshInterval?: number
  dependencies?: any[]
  transform?: (data: any) => T
  onError?: (error: Error) => void
  enabled?: boolean
}

interface RealTimeDataState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  lastUpdated: Date | null
  refresh: () => Promise<void>
  mutate: (newData: T) => void
}

export function useRealTimeData<T = any>({
  endpoint,
  refreshInterval = 30000,
  dependencies = [],
  transform,
  onError,
  enabled = true,
}: UseRealTimeDataOptions<T>): RealTimeDataState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { data: session, status } = useSession()
  const intervalRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()

  const fetchData = useCallback(async () => {
    if (!enabled || status === "loading" || !session) {
      return
    }

    try {
      setError(null)

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      const response = await fetch(endpoint, {
        signal: abortControllerRef.current.signal,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      const transformedData = transform ? transform(result) : result
      setData(transformedData)
      setLastUpdated(new Date())
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error(`Error fetching ${endpoint}:`, err)
        setError(err)
        onError?.(err)
      }
    } finally {
      setLoading(false)
    }
  }, [endpoint, enabled, session, status, transform, onError])

  const refresh = useCallback(async () => {
    setLoading(true)
    await fetchData()
  }, [fetchData])

  const mutate = useCallback((newData: T) => {
    setData(newData)
    setLastUpdated(new Date())
  }, [])

  // Initial fetch and dependency updates
  useEffect(() => {
    if (enabled && status === "authenticated") {
      fetchData()
    }
  }, [fetchData, enabled, status, ...dependencies])

  // Set up polling
  useEffect(() => {
    if (enabled && refreshInterval > 0 && status === "authenticated") {
      intervalRef.current = setInterval(fetchData, refreshInterval)
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [fetchData, refreshInterval, enabled, status])

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    mutate,
  }
}

// Specialized hooks for different data types
export function useDashboardStats() {
  return useRealTimeData({
    endpoint: "/api/dashboard/stats",
    refreshInterval: 10000, // 10 seconds for dashboard
  })
}

export function useProjects(filters?: any) {
  const params = filters ? `?${new URLSearchParams(filters).toString()}` : ""
  return useRealTimeData({
    endpoint: `/api/projects${params}`,
    refreshInterval: 30000,
    dependencies: [filters],
  })
}

export function useEquipment(filters?: any) {
  const params = filters ? `?${new URLSearchParams(filters).toString()}` : ""
  return useRealTimeData({
    endpoint: `/api/equipment${params}`,
    refreshInterval: 30000,
    dependencies: [filters],
  })
}

export function useFuelRequests(filters?: any) {
  const params = filters ? `?${new URLSearchParams(filters).toString()}` : ""
  return useRealTimeData({
    endpoint: `/api/fuel-requests${params}`,
    refreshInterval: 15000,
    dependencies: [filters],
  })
}

export function useEmployees(filters?: any) {
  const params = filters ? `?${new URLSearchParams(filters).toString()}` : ""
  return useRealTimeData({
    endpoint: `/api/employees${params}`,
    refreshInterval: 60000,
    dependencies: [filters],
  })
}

export function useClients(filters?: any) {
  const params = filters ? `?${new URLSearchParams(filters).toString()}` : ""
  return useRealTimeData({
    endpoint: `/api/clients${params}`,
    refreshInterval: 60000,
    dependencies: [filters],
  })
}
