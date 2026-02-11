
'use client';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Server, ShieldAlert, Bell, Activity } from "lucide-react"
  import { GridPattern } from "@/components/grid-pattern"
import { getMockAlerts, getMockLogEvents } from "@/lib/mock-data";
import { useEffect, useState } from "react";
  
  export function KpiCards() {
    const [kpiData, setKpiData] = useState([
        { title: "Total Events", value: "0", icon: Server },
        { title: "Anomalies Detected", value: "0", icon: Activity },
        { title: "Alerts Sent", value: "0", icon: Bell },
        { title: "High-Severity Alerts", value: "0", icon: ShieldAlert },
    ]);

    useEffect(() => {
        const allEvents = getMockLogEvents(0);
        const allAlerts = getMockAlerts(allEvents);

        const anomalies = allEvents.filter(e => e.anomalyScore > 0.7);
        const highSeverity = allAlerts.filter(a => a.severity === 'High');
        
        setKpiData([
            { title: "Total Events", value: allEvents.length.toLocaleString(), icon: Server },
            { title: "Anomalies Detected", value: anomalies.length.toLocaleString(), icon: Activity },
            { title: "Alerts Sent", value: allAlerts.length.toLocaleString(), icon: Bell },
            { title: "High-Severity Alerts", value: highSeverity.length.toLocaleString(), icon: ShieldAlert },
        ]);
    }, []);
  
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
            <GridPattern />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">Updated just now</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
