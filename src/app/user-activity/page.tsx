'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { addMockLogEvent, getMockLogEvents } from '@/lib/mock-data';
import { TimeAgo } from '@/components/time-ago';
import { Logo } from '@/components/logo';
import {
  LogOut,
  Shield,
  DatabaseBackup,
  Rocket,
  Bug,
  UserPlus,
  FileDown,
  ShieldAlert,
  ShieldOff,
  Activity,
  Terminal,
  Play,
  Square,
  Sparkles,
  Plus,
  Key,
  Server,
  Database,
  ArrowRight
} from 'lucide-react';
import type { LogEvent } from '@/types';

export default function UserActivityPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [recentUserLogs, setRecentUserLogs] = useState<LogEvent[]>([]);
  const [isTrafficSimulating, setIsTrafficSimulating] = useState(false);

  // Custom action dialog state
  const [customActionName, setCustomActionName] = useState('CUSTOM_API_CALL');
  const [customStatus, setCustomStatus] = useState<'Success' | 'Failure'>('Success');
  const [customAnomalyScore, setCustomAnomalyScore] = useState(0.4);
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);

  // Metrics counters
  const [stats, setStats] = useState({
    totalDispatched: 0,
    benign: 0,
    suspicious: 0,
    critical: 0,
  });

  const refreshLogs = () => {
    const all = getMockLogEvents(15);
    const seen = new Set<string>();
    const unique = all.filter((l) => {
      if (seen.has(l.id)) return false;
      seen.add(l.id);
      return true;
    });
    setRecentUserLogs(unique);
  };

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
    if (!role) {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Please log in first.' });
      router.push('/login');
    }

    refreshLogs();

    const handleStorageUpdate = () => {
      refreshLogs();
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('focus', handleStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('focus', handleStorageUpdate);
    };
  }, [router, toast]);

  // Automated traffic simulator
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTrafficSimulating) {
      interval = setInterval(() => {
        const sampleActions = [
          { action: 'API_CALL_GET', status: 'Success' as const, anomalyScore: 0.15, threat: false, name: 'Background API Query' },
          { action: 'DB_QUERY', status: 'Success' as const, anomalyScore: 0.22, threat: false, name: 'Read Database Record' },
          { action: 'FILE_UPLOAD', status: 'Success' as const, anomalyScore: 0.35, threat: false, name: 'Asset Ingestion' },
          { action: 'FAILED_LOGIN_ATTEMPT', status: 'Failure' as const, anomalyScore: 0.78, threat: true, name: 'Invalid Password Attempt' },
          { action: 'USER_LOGOUT', status: 'Success' as const, anomalyScore: 0.05, threat: false, name: 'Session Close' },
        ];
        const selected = sampleActions[Math.floor(Math.random() * sampleActions.length)];
        handleAction(selected, true);
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTrafficSimulating]);

  const handleAction = (
    params: {
      name: string;
      action: string;
      status: 'Success' | 'Failure';
      anomalyScore: number;
      threat: boolean;
    },
    isBackground = false
  ) => {
    addMockLogEvent({
      action: params.action,
      status: params.status,
      anomalyScore: params.anomalyScore,
    });

    refreshLogs();

    // Update session metrics
    setStats((prev) => ({
      totalDispatched: prev.totalDispatched + 1,
      benign: prev.benign + (params.anomalyScore < 0.7 ? 1 : 0),
      suspicious: prev.suspicious + (params.anomalyScore >= 0.7 && params.anomalyScore < 0.9 ? 1 : 0),
      critical: prev.critical + (params.anomalyScore >= 0.9 ? 1 : 0),
    }));

    if (!isBackground) {
      toast({
        title: `Event Generated: ${params.name}`,
        description: `Action "${params.action}" dispatched. Anomaly Score: ${params.anomalyScore.toFixed(2)}. ${
          params.threat ? 'Flagged as anomalous — forwarded to detection engine.' : 'Recorded in telemetry stream.'
        }`,
        variant: params.anomalyScore >= 0.9 ? 'destructive' : 'default',
      });
    }
  };

  const handleCustomActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customActionName.trim()) return;

    handleAction({
      name: customActionName.trim(),
      action: customActionName.trim().toUpperCase().replace(/\s+/g, '_'),
      status: customStatus,
      anomalyScore: customAnomalyScore,
      threat: customAnomalyScore > 0.7,
    });

    setIsCustomDialogOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/20 pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 md:px-8 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="hidden sm:block">
            <h2 className="text-base font-bold leading-none">Cloud-Sentinel</h2>
            <span className="text-xs text-muted-foreground">User Activity Console</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Badge variant="outline" className="text-xs font-mono capitalize">
            Role: {userRole || 'User'}
          </Badge>

          {userRole === 'admin' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="gap-1.5 h-8 text-xs font-medium"
            >
              <Shield className="h-3.5 w-3.5 text-primary" />
              Admin Dashboard
              <ArrowRight className="h-3 w-3 opacity-60" />
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 h-8 text-xs">
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6 animate-in">
        {/* Header Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background/80 p-6 rounded-xl border shadow-sm backdrop-blur-md">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Terminal className="h-7 w-7 text-primary" />
              Project Apollo Workstation
            </h1>
            <p className="text-muted-foreground text-sm max-w-2xl">
              Simulate standard developer workflows, routine API queries, and suspicious security events. Every action immediately generates raw telemetry logs ingested by the Cloud-Sentinel anomaly detection engine.
            </p>
          </div>

          {/* Traffic Simulator Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant={isTrafficSimulating ? "destructive" : "default"}
              size="sm"
              onClick={() => setIsTrafficSimulating(!isTrafficSimulating)}
              className="gap-2 shadow-sm h-9"
            >
              {isTrafficSimulating ? (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" />
                  Stop Traffic Stream
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Simulate Live Stream
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Metrics Overview Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-background/80 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 flex flex-col justify-between">
              <span className="text-xs text-muted-foreground font-medium">Session Logs Sent</span>
              <div className="text-2xl font-bold mt-1 text-primary">{stats.totalDispatched}</div>
            </CardContent>
          </Card>
          <Card className="bg-background/80 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 flex flex-col justify-between">
              <span className="text-xs text-muted-foreground font-medium">Benign Operations</span>
              <div className="text-2xl font-bold mt-1 text-emerald-500">{stats.benign}</div>
            </CardContent>
          </Card>
          <Card className="bg-background/80 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 flex flex-col justify-between">
              <span className="text-xs text-muted-foreground font-medium">Medium Anomalies</span>
              <div className="text-2xl font-bold mt-1 text-amber-500">{stats.suspicious}</div>
            </CardContent>
          </Card>
          <Card className="bg-background/80 backdrop-blur-sm shadow-sm border-destructive/40">
            <CardContent className="p-4 flex flex-col justify-between">
              <span className="text-xs text-muted-foreground font-medium">Critical Threats</span>
              <div className="text-2xl font-bold mt-1 text-destructive">{stats.critical}</div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Action Control Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Standard Developer Operations */}
          <Card className="bg-background/80 backdrop-blur-sm border shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Rocket className="h-5 w-5" />
                Standard Operations
              </CardTitle>
              <CardDescription className="text-xs">
                Benign everyday development actions that establish the baseline activity pattern.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-9 text-xs"
                onClick={() =>
                  handleAction({
                    name: 'Deploy to Staging',
                    action: 'DEPLOY_STAGING',
                    status: 'Success',
                    anomalyScore: 0.12,
                    threat: false,
                  })
                }
              >
                <Rocket className="h-4 w-4 text-emerald-500" />
                Deploy Release to Staging
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-9 text-xs"
                onClick={() =>
                  handleAction({
                    name: 'Run CI/CD Test Suite',
                    action: 'CI_TESTS',
                    status: 'Success',
                    anomalyScore: 0.08,
                    threat: false,
                  })
                }
              >
                <Bug className="h-4 w-4 text-blue-500" />
                Run Integration Tests
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-9 text-xs"
                onClick={() =>
                  handleAction({
                    name: 'Backup Database',
                    action: 'DB_BACKUP',
                    status: 'Success',
                    anomalyScore: 0.25,
                    threat: false,
                  })
                }
              >
                <DatabaseBackup className="h-4 w-4 text-amber-500" />
                Create Database Backup
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-9 text-xs"
                onClick={() =>
                  handleAction({
                    name: 'Create Repository',
                    action: 'REPO_CREATE',
                    status: 'Success',
                    anomalyScore: 0.15,
                    threat: false,
                  })
                }
              >
                <Server className="h-4 w-4 text-purple-500" />
                Create Git Repository
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Suspicious Activity & Data Extraction */}
          <Card className="bg-background/80 backdrop-blur-sm border shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Activity className="h-5 w-5" />
                Suspicious Behaviors
              </CardTitle>
              <CardDescription className="text-xs">
                Anomalous actions that trigger medium severity scoring and automated alerts.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                className="justify-start gap-2 h-9 text-xs border border-amber-500/30"
                onClick={() =>
                  handleAction({
                    name: 'Bulk Customer Export',
                    action: 'DATA_EXPORT_USER_LIST',
                    status: 'Success',
                    anomalyScore: 0.82,
                    threat: true,
                  })
                }
              >
                <FileDown className="h-4 w-4 text-amber-500" />
                Export Customer Email List
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="justify-start gap-2 h-9 text-xs border border-amber-500/30"
                onClick={() =>
                  handleAction({
                    name: 'Bulk Database Query Dump',
                    action: 'DB_QUERY_BULK_EXPORT',
                    status: 'Success',
                    anomalyScore: 0.76,
                    threat: true,
                  })
                }
              >
                <Database className="h-4 w-4 text-amber-500" />
                Query All Internal User Records
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="justify-start gap-2 h-9 text-xs border border-amber-500/30"
                onClick={() =>
                  handleAction({
                    name: 'Unauthorized API Scan',
                    action: 'UNAUTHORIZED_API_ACCESS',
                    status: 'Failure',
                    anomalyScore: 0.79,
                    threat: true,
                  })
                }
              >
                <Key className="h-4 w-4 text-amber-500" />
                Probe Restricted API Routes
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="justify-start gap-2 h-9 text-xs border border-amber-500/30"
                onClick={() =>
                  handleAction({
                    name: 'Create Unapproved Admin User',
                    action: 'USER_ADD',
                    status: 'Success',
                    anomalyScore: 0.71,
                    threat: true,
                  })
                }
              >
                <UserPlus className="h-4 w-4 text-amber-500" />
                Add Unverified Team Member
              </Button>
            </CardContent>
          </Card>

          {/* Card 3: Critical Security Threats */}
          <Card className="bg-background/80 backdrop-blur-sm border-destructive/40 shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-5 w-5" />
                Critical Threat Vectors
              </CardTitle>
              <CardDescription className="text-xs">
                High-confidence malicious actions that trigger immediate response playbooks.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              <Button
                variant="destructive"
                size="sm"
                className="justify-start gap-2 h-9 text-xs"
                onClick={() =>
                  handleAction({
                    name: 'Privilege Escalation Attempt',
                    action: 'PRIV_ESCALATION',
                    status: 'Failure',
                    anomalyScore: 0.96,
                    threat: true,
                  })
                }
              >
                <ShieldAlert className="h-4 w-4" />
                Escalate Root Privileges
              </Button>

              <Button
                variant="destructive"
                size="sm"
                className="justify-start gap-2 h-9 text-xs"
                onClick={() =>
                  handleAction({
                    name: 'Disable Audit Logs',
                    action: 'SECURITY_LOG_DISABLED',
                    status: 'Failure',
                    anomalyScore: 0.99,
                    threat: true,
                  })
                }
              >
                <ShieldOff className="h-4 w-4" />
                Disable Audit Logging Daemon
              </Button>

              <Button
                variant="destructive"
                size="sm"
                className="justify-start gap-2 h-9 text-xs"
                onClick={() =>
                  handleAction({
                    name: 'SQL Injection Authentication Bypass',
                    action: 'AUTH_LOGIN_SQL_INJECTION',
                    status: 'Success',
                    anomalyScore: 0.98,
                    threat: true,
                  })
                }
              >
                <Key className="h-4 w-4" />
                Simulate SQLi Auth Bypass
              </Button>

              {/* Custom Action Generator Dialog Trigger */}
              <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-xs mt-1 border-dashed">
                    <Plus className="h-4 w-4 text-primary" />
                    Custom Action Generator...
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px]">
                  <form onSubmit={handleCustomActionSubmit}>
                    <DialogHeader>
                      <DialogTitle>Generate Custom Security Action</DialogTitle>
                      <DialogDescription>
                        Specify custom parameters to test exact anomaly thresholds and detection rules.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid gap-1.5">
                        <Label htmlFor="custom-name">Action Identifier</Label>
                        <Input
                          id="custom-name"
                          placeholder="e.g. S3_BUCKET_PERMISSIONS_OVERWRITE"
                          value={customActionName}
                          onChange={(e) => setCustomActionName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <Label>Execution Status</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={customStatus === 'Success' ? 'default' : 'outline'}
                            onClick={() => setCustomStatus('Success')}
                            className="flex-1 h-8 text-xs"
                          >
                            Success
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={customStatus === 'Failure' ? 'destructive' : 'outline'}
                            onClick={() => setCustomStatus('Failure')}
                            className="flex-1 h-8 text-xs"
                          >
                            Failure
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <div className="flex justify-between items-center text-xs">
                          <Label>Anomaly Score</Label>
                          <span className="font-mono font-bold text-primary">{customAnomalyScore.toFixed(2)}</span>
                        </div>
                        <Slider
                          min={0.01}
                          max={1.0}
                          step={0.01}
                          value={[customAnomalyScore]}
                          onValueChange={(val) => setCustomAnomalyScore(val[0])}
                        />
                        <span className="text-[11px] text-muted-foreground">
                          {customAnomalyScore >= 0.7 ? 'Will trigger an anomaly alert on dashboard' : 'Will be logged as normal activity'}
                        </span>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCustomDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        Dispatch Event
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Live Ingestion Stream Table */}
        <Card className="bg-background/80 backdrop-blur-sm border shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent User Activity Stream
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Real-time log events generated from this workstation. These records feed directly into the admin dashboard analytics and alert pipelines.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-[180px]">Action</TableHead>
                    <TableHead>Source IP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Anomaly Score</TableHead>
                    <TableHead className="text-right">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUserLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-xs">
                        No activity recorded yet. Click any action above to generate log telemetry.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentUserLogs.map((log) => {
                      const isHighAnomaly = log.anomalyScore > 0.7;
                      return (
                        <TableRow key={log.id} className={isHighAnomaly ? 'bg-destructive/5' : undefined}>
                          <TableCell>
                            <div className="font-mono text-xs font-semibold">{log.action}</div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {log.sourceIp}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={log.status === 'Success' ? 'secondary' : 'destructive'}
                              className="text-[10px] py-0 font-medium"
                            >
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-mono text-xs font-bold ${
                                log.anomalyScore >= 0.9
                                  ? 'text-destructive'
                                  : log.anomalyScore >= 0.7
                                  ? 'text-amber-500'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {log.anomalyScore.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            <TimeAgo date={log.timestamp} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
