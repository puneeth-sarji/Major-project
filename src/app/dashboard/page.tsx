'use client'

import { AnomalyChart } from "@/components/dashboard/anomaly-chart";
import { EventsTable } from "@/components/dashboard/events-table";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { DateRangePicker } from "@/components/date-range-picker";

export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-8 animate-in pt-0 mt-0">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div className="grid gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Your security overview for the selected period.
                    </p>
                </div>
                <DateRangePicker />
            </div>

            <KpiCards />

            <div className="grid gap-6">
                <div className="w-full">
                    <AnomalyChart />
                </div>
                <div className="w-full">
                    <EventsTable />
                </div>
            </div>
        </div>
    );
}
