'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, AlertTriangle, Info, ArrowRight, Sparkles } from 'lucide-react';
import { TimeAgo } from '@/components/time-ago';
import { getMockAlerts, getMockLogEvents, filterEventsByDateRange } from '@/lib/mock-data';
import type { Alert } from '@/types';
import type { DateRange } from 'react-day-picker';

interface RecentAlertsProps {
  dateRange?: DateRange;
}

export function RecentAlerts({ dateRange }: RecentAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const updateAlerts = () => {
      const allEvents = getMockLogEvents(0);
      const filteredEvents = filterEventsByDateRange(allEvents, dateRange);
      const generatedAlerts = getMockAlerts(filteredEvents);
      
      const seen = new Set<string>();
      const uniqueAlerts = generatedAlerts.filter((a) => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });

      setAlerts(uniqueAlerts.slice(0, 6));
    };

    updateAlerts();

    const handleUpdate = () => updateAlerts();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    window.addEventListener('cloudsentinel-update', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      window.removeEventListener('cloudsentinel-update', handleUpdate);
    };
  }, [dateRange]);

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'High':
        return <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />;
      case 'Medium':
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Active Security Alerts
          </CardTitle>
          <CardDescription className="text-xs">
            Correlated anomalies requiring analyst attention in the selected range.
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
          <Link href="/dashboard/alerts">
            View All
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <ShieldAlert className="h-8 w-8 text-green-500 mb-2 opacity-80" />
            <p className="text-sm font-medium">No Security Alerts Detected</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              All monitored system logs are operating within normal parameters.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between gap-3 p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5">{getAlertIcon(alert.severity)}</div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-medium leading-snug line-clamp-1">{alert.description}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                      <span>{alert.sourceIp}</span>
                      <span>•</span>
                      <TimeAgo date={alert.timestamp} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={getSeverityBadgeVariant(alert.severity) as any} className="text-[10px] px-1.5 py-0">
                    {alert.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>{alerts.length} alerts in this window</span>
          <Link
            href="/dashboard/alerts"
            className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
          >
            Manage alerts & run AI analysis &rarr;
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
