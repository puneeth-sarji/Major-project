
"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

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
import { getMockLogEvents } from "@/lib/mock-data"
import { useMemo } from "react"

const chartConfig = {
  score: {
    label: "Anomaly Score",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function AnomalyChart() {

  const chartData = useMemo(() => {
    const events = getMockLogEvents(0);
    const dailyScores: Record<string, number[]> = {};

    events.forEach(event => {
        const date = new Date(event.timestamp).toISOString().split('T')[0];
        if (!dailyScores[date]) {
            dailyScores[date] = [];
        }
        dailyScores[date].push(event.anomalyScore);
    });

    return Object.entries(dailyScores)
        .map(([date, scores]) => ({
            date,
            score: Math.max(...scores),
        }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30); // Get last 30 days
}, []);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Anomaly Score Trend</CardTitle>
        <CardDescription>
          Showing max daily anomaly scores over the last 30 days.
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
