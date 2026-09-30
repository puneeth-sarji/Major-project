
'use client'

import { filterEventsByDateRange, getMockLogEvents } from "@/lib/mock-data"
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
import type { DateRange } from "react-day-picker"

interface EventsTableProps {
  dateRange?: DateRange
}

export function EventsTable({ dateRange }: EventsTableProps) {
  const [events, setEvents] = useState<LogEvent[]>([])

  useEffect(() => {
    const updateEvents = () => {
      const allEvents = getMockLogEvents(0);
      const filtered = filterEventsByDateRange(allEvents, dateRange);
      const seen = new Set<string>();
      const unique = filtered.filter(e => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });
      setEvents(unique.slice(0, 10));
    };

    updateEvents();
    
    window.addEventListener('storage', updateEvents);
    window.addEventListener('focus', updateEvents);

    return () => {
      window.removeEventListener('storage', updateEvents);
      window.removeEventListener('focus', updateEvents);
    };
  }, [dateRange]);

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
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No log events recorded in this date range.
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
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
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
