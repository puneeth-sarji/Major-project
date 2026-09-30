'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BellRing, Shield, AlertTriangle, Info, Search, Sparkles, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TimeAgo } from '@/components/time-ago';
import { getMockAlerts, getMockLogEvents } from '@/lib/mock-data';
import { getIncidentAnalysis } from './actions';
import type { Alert } from '@/types';
import ReactMarkdown from 'react-markdown';

// Dynamically import PixelBlast to ensure it's client-side rendered
const PixelBlast = dynamic(() => import('@/components/PixelBlast'), {
  ssr: false, // Ensure this component is only rendered on the client side
});

export default function AlertsPage() {
  const [mounted, setMounted] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | 'High' | 'Medium' | 'Low'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  const loadAlerts = () => {
    const allEvents = getMockLogEvents(0);
    const generatedAlerts = getMockAlerts(allEvents);
    const seen = new Set<string>();
    const unique = generatedAlerts.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
    setAlerts(unique);
  };

  useEffect(() => {
    setMounted(true);
    loadAlerts();

    const handleUpdate = () => loadAlerts();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    window.addEventListener('cloudsentinel-update', handleUpdate);
    const interval = setInterval(handleUpdate, 2500);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      window.removeEventListener('cloudsentinel-update', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleOpenAnalysis = async (alert: Alert) => {
    setSelectedAlert(alert);
    setIsLoadingAnalysis(true);
    setAiAnalysis(null);
    try {
      const res = await getIncidentAnalysis(alert);
      if (res.success && res.analysis?.incidentSummary) {
        setAiAnalysis(res.analysis.incidentSummary);
      } else {
        setAiAnalysis('Could not generate AI analysis for this alert.');
      }
    } catch (err) {
      console.error('Error getting AI analysis:', err);
      setAiAnalysis('Failed to fetch incident analysis.');
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'High':
        return <Shield className="h-5 w-5 text-red-500 shrink-0" />;
      case 'Medium':
        return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
      default:
        return <Info className="h-5 w-5 text-blue-500 shrink-0" />;
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

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSeverity = selectedSeverity === 'ALL' || alert.severity === selectedSeverity;
      const matchesSearch =
        searchQuery.trim() === '' ||
        alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.sourceIp.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.severity.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSeverity && matchesSearch;
    });
  }, [alerts, selectedSeverity, searchQuery]);

  return (
    <div className="relative w-full min-h-screen">
      {/* Background Layer */}
      {mounted && (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <PixelBlast
            variant="circle"
            pixelSize={6}
            color="#B19EEF"
            patternScale={3}
            patternDensity={1.2}
            pixelSizeJitter={0.5}
            enableRipples
            rippleSpeed={0.4}
            rippleThickness={0.12}
            rippleIntensityScale={1.5}
            liquid
            liquidStrength={0.12}
            liquidRadius={1.2}
            liquidWobbleSpeed={5}
            speed={0.6}
            edgeFade={0.25}
            transparent
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col min-h-screen gap-6 pt-0 pb-12 px-2 md:px-6 lg:px-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="grid gap-1 rounded-lg bg-background/80 p-2 backdrop-blur-sm w-fit mt-0">
            <h1 className="text-3xl font-bold tracking-tight leading-tight m-0">Security Alerts</h1>
            <p className="text-muted-foreground m-0">
              Correlated alerts generated directly from anomalous system log events.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by IP or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/80 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex flex-wrap gap-2 items-center">
          {(['ALL', 'High', 'Medium', 'Low'] as const).map((sev) => {
            const count = sev === 'ALL' ? alerts.length : alerts.filter((a) => a.severity === sev).length;
            const isActive = selectedSeverity === sev;
            return (
              <Button
                key={sev}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSeverity(sev)}
                className="h-8 text-xs bg-background/80 backdrop-blur-sm"
              >
                {sev === 'ALL' ? 'All Alerts' : `${sev} Severity`}
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-muted text-muted-foreground font-mono">
                  {count}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Alerts List */}
        {filteredAlerts.length > 0 ? (
          <div className="grid gap-4">
            {filteredAlerts.map((alert) => (
              <Card key={alert.id} className="bg-background/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      {getAlertIcon(alert.severity)}
                      <span>{alert.severity} Severity Alert</span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityBadgeVariant(alert.severity) as any}>
                        {alert.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-code bg-muted px-2 py-0.5 rounded">
                        Log: {alert.logId.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <p className="text-base font-medium">{alert.description}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          <strong>Source IP:</strong> <code className="font-mono">{alert.sourceIp}</code>
                        </span>
                        <span>
                          <strong>Recorded:</strong> <TimeAgo date={alert.timestamp} />
                        </span>
                        <span className="hidden sm:inline">
                          ({new Date(alert.timestamp).toLocaleString()})
                        </span>
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 gap-1.5 shadow-sm"
                          onClick={() => handleOpenAnalysis(alert)}
                        >
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          AI Analysis
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {selectedAlert && getAlertIcon(selectedAlert.severity)}
                            AI Incident Analysis
                          </DialogTitle>
                        </DialogHeader>

                        {isLoadingAnalysis ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Analyzing log anomaly and synthesizing incident report...</p>
                          </div>
                        ) : (
                          <div className="space-y-4 py-2">
                            {selectedAlert && (
                              <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1 border">
                                <p><strong>Description:</strong> {selectedAlert.description}</p>
                                <p><strong>Source IP:</strong> {selectedAlert.sourceIp}</p>
                                <p><strong>Timestamp:</strong> {new Date(selectedAlert.timestamp).toLocaleString()}</p>
                              </div>
                            )}

                            <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                              {aiAnalysis && <ReactMarkdown>{aiAnalysis}</ReactMarkdown>}
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-background/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-6 w-6 text-green-500" />
                <span>No Alerts Found</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {searchQuery || selectedSeverity !== 'ALL'
                  ? 'No alerts match your search or severity filter.'
                  : 'All systems are operating normally with no anomalous log activity.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}