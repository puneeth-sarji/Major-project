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

const chartData = [
  { date: "2024-07-15", score: 0.21 },
  { date: "2024-07-16", score: 0.32 },
  { date: "2024-07-17", score: 0.15 },
  { date: "2024-07-18", score: 0.89 },
  { date: "2024-07-19", score: 0.45 },
  { date: "2024-07-20", score: 0.28 },
  { date: "2024-07-21", score: 0.92 },
]

const chartConfig = {
  score: {
    label: "Anomaly Score",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function AnomalyChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anomaly Score Trend</CardTitle>
        <CardDescription>
          Showing anomaly scores over the last 7 days.
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
            <Area
              dataKey="score"
              type="natural"
              fill="var(--color-score)"
              fillOpacity={0.4}
              stroke="var(--color-score)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
