'use client'

import { useState } from "react";
import { subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { AnomalyChart } from "@/components/dashboard/anomaly-chart";
import { EventsTable } from "@/components/dashboard/events-table";
import { RecentAlerts } from "@/components/dashboard/recent-alerts";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { DateRangePicker } from "@/components/date-range-picker";

export default function DashboardPage() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
        from: subDays(new Date(), 6),
        to: new Date(),
    }));

    return (
        <div className="flex flex-col gap-8 animate-in pt-0 mt-0">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div className="grid gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Your security overview for the selected period.
                    </p>
                </div>
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            </div>

            <KpiCards dateRange={dateRange} />

            <div className="grid gap-6">
                <div className="w-full">
                    <AnomalyChart dateRange={dateRange} />
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <RecentAlerts dateRange={dateRange} />
                    <EventsTable dateRange={dateRange} />
                </div>
            </div>
        </div>
    );
}
