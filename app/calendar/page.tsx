"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { AddEventDialog } from "@/components/add-event-dialog"
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}
export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day">("month")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Mock events data
  const events = [
    {
      id: 1,
      title: "Site Inspection - Highway Extension",
      date: new Date(2024, 5, 15),
      type: "inspection",
      project: "Highway Extension Phase 2",
    },
    {
      id: 2,
      title: "Equipment Maintenance - Excavator XC-201",
      date: new Date(2024, 5, 18),
      type: "maintenance",
      project: null,
    },
    {
      id: 3,
      title: "Client Meeting - Bridge Project",
      date: new Date(2024, 5, 20),
      type: "meeting",
      project: "Bridge Reconstruction",
    },
    {
      id: 4,
      title: "Material Delivery",
      date: new Date(2024, 5, 22),
      type: "delivery",
      project: "Commercial Complex",
    },
    {
      id: 5,
      title: "Safety Training Session",
      date: new Date(2024, 5, 25),
      type: "training",
      project: null,
    },
  ]

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "inspection":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "maintenance":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "meeting":
        return "bg-green-100 text-green-800 border-green-200"
      case "delivery":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "training":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(clickedDate)
  }

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border border-gray-200 bg-gray-50"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = events.filter(
        (event) =>
          event.date.getDate() === day &&
          event.date.getMonth() === currentDate.getMonth() &&
          event.date.getFullYear() === currentDate.getFullYear(),
      )

      days.push(
        <div
          key={day}
          className="h-32 border border-gray-200 bg-white p-2 overflow-hidden cursor-pointer hover:bg-gray-50"
          onClick={() => handleDateClick(day)}
        >
          <div className="font-medium text-sm mb-1">{day}</div>
          <div className="space-y-1">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded border ${getEventTypeColor(event.type)} truncate cursor-pointer hover:opacity-80`}
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle event click
                  console.log("Event clicked:", event)
                }}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>,
      )
    }

    return days
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Calendar className="h-5 w-5" />
          Calendar
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant={view === "month" ? "default" : "outline"} size="sm" onClick={() => setView("month")}>
              Month
            </Button>
            <Button variant={view === "week" ? "default" : "outline"} size="sm" onClick={() => setView("week")}>
              Week
            </Button>
            <Button variant={view === "day" ? "default" : "outline"} size="sm" onClick={() => setView("day")}>
              Day
            </Button>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <AddEventDialog selectedDate={selectedDate || undefined} />
        </div>
      </header>

      <div className="p-6">
        <div className="space-y-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">
                {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h1>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
          </div>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle>Event Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">Inspection</Badge>
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">Maintenance</Badge>
                <Badge className="bg-green-100 text-green-800 border-green-200">Meeting</Badge>
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">Delivery</Badge>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Training</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Grid */}
          <Card>
            <CardContent className="p-0">
              {/* Days of week header */}
              <div className="grid grid-cols-7 border-b">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="p-4 text-center font-medium bg-gray-50 border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              {/* Calendar days */}
              <div className="grid grid-cols-7">{renderCalendarGrid()}</div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Events scheduled for the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events
                  .filter(
                    (event) => event.date >= new Date() && event.date <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                  )
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {event.date.toLocaleDateString("en-US", { month: "short" })}
                          </div>
                          <div className="text-2xl font-bold">{event.date.getDate()}</div>
                        </div>
                        <div>
                          <h3 className="font-medium">{event.title}</h3>
                          {event.project && <p className="text-sm text-muted-foreground">{event.project}</p>}
                        </div>
                      </div>
                      <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
