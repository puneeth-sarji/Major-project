
'use client'

import { getMockLogEvents } from "@/lib/mock-data"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TimeAgo } from "@/components/time-ago"
import { useEffect, useState } from "react"
import type { LogEvent } from "@/types"

export function EventsTable() {
  const [events, setEvents] = useState<LogEvent[]>([])

  useEffect(() => {
    // Set initial data on mount
    setEvents(getMockLogEvents(10));
    
    // This component will now re-render and get the latest events when the data changes in session storage
    const handleStorageChange = () => {
      setEvents(getMockLogEvents(10));
    };
    
    window.addEventListener('storage', handleStorageChange);

    // Also check when the window gets focus, as storage events don't fire on the same tab
     const handleFocus = () => {
       setEvents(getMockLogEvents(10));
     };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Events</CardTitle>
        <CardDescription>A list of the most recent log events ingested by the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead className="hidden sm:table-cell">Source IP</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Anomaly Score</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="font-medium font-code">{event.action}</div>
                  <div className="text-sm text-muted-foreground md:hidden">{event.sourceIp}</div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{event.sourceIp}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge className="text-xs" variant={event.status === "Success" ? "secondary" : "destructive"}>
                    {event.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">{event.anomalyScore.toFixed(2)}</TableCell>
                <TableCell className="text-right"><TimeAgo date={event.timestamp} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
