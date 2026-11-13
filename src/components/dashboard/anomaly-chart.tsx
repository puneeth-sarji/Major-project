
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
    window.addEventListener('cloudsentinel-update', updateEvents);
    return () => {
      window.removeEventListener('storage', updateEvents);
      window.removeEventListener('focus', updateEvents);
      window.removeEventListener('cloudsentinel-update', updateEvents);
    };
  }, []);

  const chartData = useMemo(() => {
    const filteredEvents = filterEventsByDateRange(events, dateRange);
    const dailyScores: Record<string, number[]> = {};

    filteredEvents.forEach(event => {
      // Use local calendar date formatting rather than toISOString() to avoid timezone day shifts
      const dateStr = format(new Date(event.timestamp), 'yyyy-MM-dd');
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
          const dateStr = format(curr, 'yyyy-MM-dd');
          const scores = dailyScores[dateStr];
          const rawScore = scores && scores.length > 0 ? Math.max(...scores) : 0;
          // Clamp score strictly between 0.0 and 1.0 to prevent any negative values
          const score = Math.max(0, Math.min(1, parseFloat(rawScore.toFixed(2))));
          days.push({
            date: dateStr,
            score,
          });
          curr = addDays(curr, 1);
        }
        return days;
      }
    }

    return Object.entries(dailyScores)
      .map(([date, scores]) => {
        const rawScore = Math.max(...scores);
        return {
          date,
          score: Math.max(0, Math.min(1, parseFloat(rawScore.toFixed(2)))),
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, dateRange]);

  const dateDescription = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      const fromFormatted = format(dateRange.from, "LLL dd, y");
      const toFormatted = format(dateRange.to, "LLL dd, y");
      if (fromFormatted === toFormatted) {
        return `Showing max daily anomaly scores for ${fromFormatted}.`;
      }
      return `Showing max daily anomaly scores from ${fromFormatted} to ${toFormatted}.`;
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
              top: 10,
              left: 12,
              right: 12,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                if (!value || typeof value !== 'string') return '';
                const [y, m, d] = value.split('-').map(Number);
                if (isNaN(y) || isNaN(m) || isNaN(d)) return value;
                const date = new Date(y, m - 1, d);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
             <YAxis
                domain={[0, 1]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                ticks={[0, 0.25, 0.5, 0.75, 1.0]}
                tickFormatter={(val) => val.toFixed(2)}
                allowDataOverflow={false}
             />
            <ChartTooltip
              cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(label) => {
                    if (!label || typeof label !== 'string') return label;
                    const [y, m, d] = label.split('-').map(Number);
                    if (isNaN(y) || isNaN(m) || isNaN(d)) return label;
                    const date = new Date(y, m - 1, d);
                    return date.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
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
                    stopOpacity={0.05}
                    />
                </linearGradient>
             </defs>
            <Area
              dataKey="score"
              type="monotone"
              fill="url(#fillScore)"
              stroke="var(--color-score)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--color-score)", strokeWidth: 1 }}
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
