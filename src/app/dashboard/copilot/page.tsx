'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/date-range-picker';
import { GridPattern } from '@/components/grid-pattern';
import {
  BrainCircuit,
  Sparkles,
  Loader2,
  Send,
  Copy,
  Check,
  Server,
  ShieldAlert,
  Bell,
  Activity,
  Globe,
  Zap,
  MessageSquare,
  Bot,
  User,
  ArrowRight,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getCopilotBriefing, askCopilotAction } from './actions';
import { getMockLogEvents, getMockAlerts, filterEventsByDateRange } from '@/lib/mock-data';
import type { LogEvent, Alert } from '@/types';

const Prism = dynamic(() => import('@/components/Prism'), {
  ssr: false,
});

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const SUGGESTED_QUERIES = [
  'Which IPs should be blocked immediately?',
  'Explain the SQL injection attacks.',
  'What should be done about privilege escalation?',
  'Recommend response playbooks to run.',
];

export default function CopilotPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
    from: subDays(new Date(), 6),
    to: new Date(),
  }));

  const [briefing, setBriefing] = useState<string>('');
  const [briefingTime, setBriefingTime] = useState<string>('');
  const [isLoadingBriefing, setIsLoadingBriefing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Exact matching dashboard KPI cards
  const [kpiData, setKpiData] = useState([
    { title: 'Total Events', value: '0', icon: Server },
    { title: 'Anomalies Detected', value: '0', icon: Activity },
    { title: 'Alerts Sent', value: '0', icon: Bell },
    { title: 'High-Severity Alerts', value: '0', icon: ShieldAlert },
  ]);

  const [filteredEventsList, setFilteredEventsList] = useState<LogEvent[]>([]);
  const [recentAlertsList, setRecentAlertsList] = useState<Alert[]>([]);
  const [topIps, setTopIps] = useState<Array<{ ip: string; count: number; country: string }>>([]);

  // Interactive chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '👋 **Hello, Analyst!** I am your CloudSentinel AI Co-pilot. I analyze your live Dashboard telemetry, evaluate risk levels, and guide incident remediation. Generate your briefing or ask me any question below.',
      timestamp: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Refresh telemetry matching Dashboard
  const refreshTelemetry = useCallback(() => {
    const allEvents = getMockLogEvents(0);
    const filteredEvents = filterEventsByDateRange(allEvents, dateRange);
    const allAlerts = getMockAlerts(filteredEvents);

    const anomalies = filteredEvents.filter(e => e.anomalyScore > 0.7);
    const highSeverity = allAlerts.filter(a => a.severity === 'High');

    setFilteredEventsList(filteredEvents);
    setRecentAlertsList(allAlerts.slice(0, 4));

    setKpiData([
      { title: 'Total Events', value: filteredEvents.length.toLocaleString(), icon: Server },
      { title: 'Anomalies Detected', value: anomalies.length.toLocaleString(), icon: Activity },
      { title: 'Alerts Sent', value: allAlerts.length.toLocaleString(), icon: Bell },
      { title: 'High-Severity Alerts', value: highSeverity.length.toLocaleString(), icon: ShieldAlert },
    ]);

    // Top suspicious IPs
    const ipMap: Record<string, { count: number; country: string }> = {};
    for (const ev of anomalies) {
      if (ev.sourceIp) {
        if (!ipMap[ev.sourceIp]) {
          ipMap[ev.sourceIp] = { count: 0, country: ev.country || 'Global' };
        }
        ipMap[ev.sourceIp].count += 1;
      }
    }
    const sortedIps = Object.entries(ipMap)
      .map(([ip, d]) => ({ ip, count: d.count, country: d.country }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
    setTopIps(sortedIps);

    return filteredEvents;
  }, [dateRange]);

  useEffect(() => {
    setMounted(true);
    refreshTelemetry();

    const handleUpdate = () => {
      refreshTelemetry();
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('cloudsentinel-update', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('cloudsentinel-update', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [refreshTelemetry]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAnswering]);

  const handleStartBriefing = async () => {
    setIsLoadingBriefing(true);
    try {
      const currentEvents = refreshTelemetry();
      const result = await getCopilotBriefing(currentEvents);

      if (result.success && result.briefing) {
        setBriefing(result.briefing);
        setBriefingTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        setBriefing(`Sorry, I was unable to generate a briefing: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error during briefing generation:', error);
      setBriefing('An unexpected error occurred while generating the security briefing. Please try again.');
    } finally {
      setIsLoadingBriefing(false);
    }
  };

  const handleCopyBriefing = () => {
    if (!briefing) return;
    navigator.clipboard.writeText(briefing);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = async (customQuery?: string) => {
    const textToSend = (customQuery || inputQuery).trim();
    if (!textToSend || isAnswering) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsAnswering(true);

    try {
      const currentEvents = filteredEventsList.length > 0 ? filteredEventsList : getMockLogEvents(0);
      const history = chatMessages.slice(-6).map(m => ({
        role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
        content: m.content,
      }));

      const res = await askCopilotAction(textToSend, currentEvents, history);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.success && res.reply ? res.reply : `⚠️ ${res.error || 'Unable to complete analysis.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error answering copilot query:', err);
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ An error occurred while communicating with CloudSentinel AI. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen">
      {/* Background Ambient Prism Layer */}
      {mounted && (
        <div className="fixed inset-0 pointer-events-none opacity-25 dark:opacity-40" style={{ zIndex: 0 }}>
          <Prism
            animationType="rotate"
            timeScale={0.3}
            height={3.5}
            baseWidth={5.5}
            scale={3.5}
            hueShift={0}
            colorFrequency={1}
            noise={0.3}
            glow={0.8}
          />
        </div>
      )}

      {/* Main Page Layout Container */}
      <div className="relative z-10 flex flex-col gap-6 md:gap-8 animate-in px-4 md:px-6 lg:px-8 py-0 pb-12">
        {/* Standard Page Header */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="grid gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">AI Co-pilot</h1>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                Live Telemetry
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Real-time security intelligence briefings and interactive SOC advisory powered by live Dashboard data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            <Button
              onClick={handleStartBriefing}
              disabled={isLoadingBriefing}
              className="gap-2 font-medium shadow-sm"
            >
              {isLoadingBriefing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-amber-300" />
              )}
              {isLoadingBriefing ? 'Compiling...' : briefing ? 'Refresh Briefing' : 'Start Live Briefing'}
            </Button>
          </div>
        </div>

        {/* 4 Dashboard KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi, index) => (
            <Card
              key={index}
              className="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 bg-background/80 backdrop-blur-sm"
            >
              <GridPattern />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <kpi.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">Matches dashboard period</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Workspace: Left Briefing (7 cols) + Right Chat & Intelligence (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Security Briefing & Active Alerts */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Security Posture Briefing Card */}
            <Card className="bg-background/85 backdrop-blur-md shadow-sm">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        Security Posture Briefing
                        {briefingTime && (
                          <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                            Updated {briefingTime}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Synthesized from {kpiData[0].value} events & {kpiData[2].value} alerts in current timeframe
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {briefing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyBriefing}
                        className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartBriefing}
                      disabled={isLoadingBriefing}
                      className="h-8 gap-1 text-xs"
                    >
                      <RotateCw className={`h-3 w-3 ${isLoadingBriefing ? 'animate-spin' : ''}`} />
                      <span>{briefing ? 'Refresh' : 'Generate'}</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 min-h-[360px] max-h-[580px] overflow-y-auto">
                {isLoadingBriefing ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="font-semibold text-sm">Synthesizing Security Briefing...</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Evaluating {kpiData[0].value} events, correlating {kpiData[2].value} alerts, and compiling tactical recommendations.
                    </p>
                  </div>
                ) : briefing ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none space-y-3 leading-relaxed">
                    <ReactMarkdown>{briefing}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                      <BrainCircuit className="h-7 w-7 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">Generate Security Intelligence Briefing</h3>
                      <p className="text-xs text-muted-foreground max-w-md mt-1">
                        Click below to generate a tailored briefing summarizing your <strong>{kpiData[2].value} alerts</strong>, top threat vectors, and recommended containment steps.
                      </p>
                    </div>
                    <Button onClick={handleStartBriefing} className="gap-2" size="sm">
                      <Sparkles className="h-4 w-4" />
                      Start Live Briefing
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Dashboard Alerts Preview */}
            {recentAlertsList.length > 0 && (
              <Card className="bg-background/85 backdrop-blur-md shadow-sm">
                <CardHeader className="py-3 px-4 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-destructive" />
                      <span>Active Dashboard Alerts Under Review</span>
                    </CardTitle>
                    <Link href="/dashboard/alerts" className="text-xs text-primary hover:underline flex items-center gap-1">
                      <span>View All</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {recentAlertsList.map(alert => (
                      <div
                        key={alert.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors border text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Badge
                            variant={
                              alert.severity === 'High'
                                ? 'destructive'
                                : alert.severity === 'Medium'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="text-[10px] py-0 px-1.5 shrink-0"
                          >
                            {alert.severity}
                          </Badge>
                          <span className="font-medium truncate max-w-sm">
                            {alert.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-muted-foreground text-[11px]">
                          <span className="font-mono bg-background px-1.5 py-0.5 rounded border">
                            {alert.sourceIp}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] px-2 text-primary"
                            onClick={() => handleSendMessage(`Analyze alert: "${alert.description}" from IP ${alert.sourceIp}`)}
                          >
                            Ask AI
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link href="/dashboard/alerts" className="group">
                <Card className="bg-background/80 backdrop-blur-sm hover:border-primary/50 transition-all shadow-sm">
                  <CardContent className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Bell className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-medium">Alerts ({kpiData[2].value})</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </CardContent>
                </Card>
              </Link>

              <Link href="/dashboard/playbooks" className="group">
                <Card className="bg-background/80 backdrop-blur-sm hover:border-primary/50 transition-all shadow-sm">
                  <CardContent className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-medium">Playbooks</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </CardContent>
                </Card>
              </Link>

              <Link href="/user-activity" className="group">
                <Card className="bg-background/80 backdrop-blur-sm hover:border-primary/50 transition-all shadow-sm">
                  <CardContent className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-medium">User Activity</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive AI Copilot Chat & Threat Radar */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Interactive Chat Console */}
            <Card className="bg-background/85 backdrop-blur-md shadow-sm flex flex-col h-[520px]">
              <CardHeader className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">Interactive Co-pilot Chat</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    SOC AI Agent
                  </Badge>
                </div>
              </CardHeader>

              {/* Chat Message Stream */}
              <CardContent className="p-4 flex-1 overflow-y-auto space-y-3">
                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'bg-muted/70 border text-foreground'
                      }`}
                    >
                      <div className="prose prose-xs dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      <div
                        className={`text-[9px] mt-1.5 opacity-60 ${
                          msg.role === 'user' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="h-7 w-7 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 mt-0.5">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isAnswering && (
                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 animate-bounce" />
                    </div>
                    <div className="bg-muted/70 border rounded-xl px-3.5 py-2.5 text-xs flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span>Analyzing security telemetry...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </CardContent>

              {/* Suggested Query Chips */}
              <div className="px-4 py-2 border-t bg-muted/20">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Suggested Queries:
                </p>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {SUGGESTED_QUERIES.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      disabled={isAnswering}
                      className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors border"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t bg-background flex items-center gap-2">
                <Input
                  value={inputQuery}
                  onChange={e => setInputQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask Copilot about anomalies, IPs, or threat mitigation..."
                  className="text-xs h-9"
                  disabled={isAnswering}
                />
                <Button
                  size="sm"
                  onClick={() => handleSendMessage()}
                  disabled={isAnswering || !inputQuery.trim()}
                  className="h-9 w-9 p-0 shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>

            {/* Top Flagged Threat Actors Card */}
            <Card className="bg-background/85 backdrop-blur-md shadow-sm">
              <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    <span>Top Suspicious Source IPs</span>
                  </div>
                  <Badge variant="secondary" className="text-[9px] py-0 px-1.5">
                    Active Radar
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {topIps.length > 0 ? (
                  <div className="space-y-2">
                    {topIps.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors border"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-destructive">{item.ip}</span>
                          <span className="text-[10px] text-muted-foreground">({item.country})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">
                            {item.count} anomalies
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] px-1.5 text-primary"
                            onClick={() => handleSendMessage(`Analyze threat intelligence and risks for IP ${item.ip}`)}
                          >
                            Analyze
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>No critical anomalous IP spikes currently active.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}