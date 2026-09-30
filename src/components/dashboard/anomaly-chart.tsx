
"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import { addDays, format, startOfDay } from "date-fns"
import type { DateRange } from "react-day-picker"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { filterEventsByDateRange, getMockLogEvents } from "@/lib/mock-data"
import { useEffect, useMemo, useState } from "react"
import type { LogEvent } from "@/types"

const chartConfig = {
  score: {
    label: "Anomaly Score",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

interface AnomalyChartProps {
  dateRange?: DateRange
}

export function AnomalyChart({ dateRange }: AnomalyChartProps) {
  const [events, setEvents] = useState<LogEvent[]>([])

  useEffect(() => {
    const updateEvents = () => {
      setEvents(getMockLogEvents(0));
    };
    updateEvents();

    window.addEventListener('storage', updateEvents);
    window.addEventListener('focus', updateEvents);
    return () => {
      window.removeEventListener('storage', updateEvents);
      window.removeEventListener('focus', updateEvents);
    };
  }, []);

  const chartData = useMemo(() => {
    const filteredEvents = filterEventsByDateRange(events, dateRange);
    const dailyScores: Record<string, number[]> = {};

    filteredEvents.forEach(event => {
      const dateStr = new Date(event.timestamp).toISOString().split('T')[0];
      if (!dailyScores[dateStr]) {
        dailyScores[dateStr] = [];
      }
      dailyScores[dateStr].push(event.anomalyScore);
    });

    if (dateRange?.from) {
      const days: { date: string; score: number }[] = [];
      let curr = startOfDay(dateRange.from);
      const end = startOfDay(dateRange.to || dateRange.from);
      
      if (curr <= end) {
        while (curr <= end) {
          const dateStr = curr.toISOString().split('T')[0];
          const scores = dailyScores[dateStr];
          days.push({
            date: dateStr,
            score: scores && scores.length > 0 ? Math.max(...scores) : 0,
          });
          curr = addDays(curr, 1);
        }
        return days;
      }
    }

    return Object.entries(dailyScores)
      .map(([date, scores]) => ({
        date,
        score: Math.max(...scores),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, dateRange]);

  const dateDescription = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return `Showing max daily anomaly scores from ${format(dateRange.from, "LLL dd, y")} to ${format(dateRange.to, "LLL dd, y")}.`;
    }
    if (dateRange?.from) {
      return `Showing max daily anomaly scores for ${format(dateRange.from, "LLL dd, y")}.`;
    }
    return "Showing max daily anomaly scores for the selected period.";
  }, [dateRange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anomaly Score Trend</CardTitle>
        <CardDescription>
          {dateDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
             <YAxis
                domain={[0, 1]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
             />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <defs>
                <linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1">
                    <stop
                    offset="5%"
                    stopColor="var(--color-score)"
                    stopOpacity={0.8}
                    />
                    <stop
                    offset="95%"
                    stopColor="var(--color-score)"
                    stopOpacity={0.1}
                    />
                </linearGradient>
             </defs>
            <Area
              dataKey="score"
              type="natural"
              fill="url(#fillScore)"
              stroke="var(--color-score)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
