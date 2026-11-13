'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ShieldCheck,
  ShieldOff,
  Zap,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  History,
  CheckCircle2,
  Bot,
  Radio,
  Clock,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import dynamic from 'next/dynamic';
import {
  type Playbook,
  type ExecutionLog,
  INITIAL_PLAYBOOKS,
  getStoredPlaybooks,
  saveStoredPlaybooks,
  getPlaybookHistory,
  clearPlaybookHistory,
  executePlaybookLocally,
  isAutoMitigationEnabled,
  setAutoMitigationEnabled,
} from '@/lib/playbook-store';
import { TimeAgo } from '@/components/time-ago';


const LetterGlitch = dynamic(() => import('@/components/LetterGlitch'), {
  ssr: false,
});

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>(INITIAL_PLAYBOOKS);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [isAutoEnabled, setIsAutoEnabled] = useState(true);
  const [runningPlaybookId, setRunningPlaybookId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'playbooks' | 'logs'>('playbooks');
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form State for Create / Edit
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTrigger, setFormTrigger] = useState('');
  const [formActions, setFormActions] = useState('');

  const { toast } = useToast();

  // Real-time synchronization
  useEffect(() => {
    const updateData = () => {
      setPlaybooks(getStoredPlaybooks());
      setExecutionLogs(getPlaybookHistory());
      setIsAutoEnabled(isAutoMitigationEnabled());
    };

    updateData();

    window.addEventListener('storage', updateData);
    window.addEventListener('focus', updateData);
    window.addEventListener('cloudsentinel-playbook-update', updateData);
    window.addEventListener('cloudsentinel-update', updateData);

    const interval = setInterval(updateData, 2000);

    return () => {
      window.removeEventListener('storage', updateData);
      window.removeEventListener('focus', updateData);
      window.removeEventListener('cloudsentinel-playbook-update', updateData);
      window.removeEventListener('cloudsentinel-update', updateData);
      clearInterval(interval);
    };
  }, []);

  const handleToggleAutoMitigation = (enabled: boolean) => {
    setIsAutoEnabled(enabled);
    setAutoMitigationEnabled(enabled);
    toast({
      title: enabled ? "⚡ Real-Time Auto-Mitigation Active" : "Auto-Mitigation Paused",
      description: enabled
        ? "Enabled playbooks will execute automatically in real time whenever anomalous events or threats occur."
        : "Playbooks will now only execute upon manual analyst trigger.",
    });
  };

  const handleToggle = (playbookId: string) => {
    const current = getStoredPlaybooks();
    const target = current.find(pb => pb.id === playbookId);
    const newStatus = target ? !target.enabled : false;
    const updated = current.map(pb => pb.id === playbookId ? { ...pb, enabled: newStatus } : pb);
    saveStoredPlaybooks(updated);
    setPlaybooks(updated);

    toast({
      title: newStatus ? "Playbook Activated" : "Playbook Deactivated",
      description: `"${target?.title}" is now ${newStatus ? 'active' : 'inactive'}. Changes applied in real time.`,
    });
  };

  const handleOpenCreate = () => {
    setEditingPlaybook(null);
    setFormTitle('');
    setFormDesc('');
    setFormTrigger('');
    setFormActions('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (playbook: Playbook) => {
    setEditingPlaybook(playbook);
    setFormTitle(playbook.title);
    setFormDesc(playbook.description);
    setFormTrigger(playbook.trigger);
    setFormActions(playbook.actions.join('\n'));
    setIsDialogOpen(true);
  };

  const handleSavePlaybook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const actionList = formActions
      .split('\n')
      .map(a => a.trim())
      .filter(a => a.length > 0);

    const current = getStoredPlaybooks();

    if (editingPlaybook) {
      const updated = current.map(pb => pb.id === editingPlaybook.id ? {
        ...pb,
        title: formTitle.trim(),
        description: formDesc.trim(),
        trigger: formTrigger.trim(),
        actions: actionList.length > 0 ? actionList : ['Perform automated response.'],
      } : pb);
      saveStoredPlaybooks(updated);
      setPlaybooks(updated);
      toast({
        title: "Playbook Updated",
        description: `Changes to "${formTitle}" have been saved and applied.`,
      });
    } else {
      const newPb: Playbook = {
        id: `pb-${Date.now().toString(36)}`,
        title: formTitle.trim(),
        description: formDesc.trim() || 'Custom automated response workflow.',
        trigger: formTrigger.trim() || 'Manual or scheduled anomaly trigger.',
        actions: actionList.length > 0 ? actionList : ['Execute response step.'],
        enabled: true,
        runCount: 0,
      };
      const updated = [...current, newPb];
      saveStoredPlaybooks(updated);
      setPlaybooks(updated);
      toast({
        title: "Playbook Created",
        description: `New playbook "${formTitle}" is now live.`,
      });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (playbookId: string) => {
    const current = getStoredPlaybooks();
    const target = current.find(pb => pb.id === playbookId);
    const updated = current.filter(pb => pb.id !== playbookId);
    saveStoredPlaybooks(updated);
    setPlaybooks(updated);
    toast({
      title: "Playbook Removed",
      description: `"${target?.title}" has been deleted.`,
    });
  };

  const handleResetDefaults = () => {
    saveStoredPlaybooks(INITIAL_PLAYBOOKS);
    setPlaybooks(INITIAL_PLAYBOOKS);
    toast({
      title: "Defaults Restored",
      description: "Playbooks have been reset to factory defaults.",
    });
  };

  const handleClearHistory = () => {
    clearPlaybookHistory();
    setExecutionLogs([]);
    toast({
      title: "Audit Trail Cleared",
      description: "Playbook execution history has been cleared.",
    });
  };

  const handleRunTest = async (playbook: Playbook) => {
    setRunningPlaybookId(playbook.id);
    try {
      const result = executePlaybookLocally(playbook.id, {
        mode: 'Manual',
        triggerEvent: 'Analyst Test Run Trigger',
      });

      // Synchronize state immediately
      setPlaybooks(getStoredPlaybooks());
      setExecutionLogs(getPlaybookHistory());

      toast({
        title: "⚡ Playbook Executed in Real Time",
        description: result.log.message,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Execution Error",
        description: err instanceof Error ? err.message : 'Unknown execution failure',
      });
    } finally {
      setRunningPlaybookId(null);
    }
  };

  const activeCount = playbooks.filter(p => p.enabled).length;

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={false}
          smooth={true}
          className="w-full h-full"
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen gap-6 p-4 md:p-8 animate-in max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="grid gap-1 rounded-lg bg-background/85 p-3 backdrop-blur-md w-fit border shadow-sm">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Automated Response Playbooks</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Define, configure, and execute real-time automated workflows to instantly mitigate security threats.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Real-Time Auto-Mitigation Engine Toggle */}
            <div className="flex items-center gap-2.5 bg-background/85 backdrop-blur-md border px-3 py-1.5 rounded-lg shadow-sm">
              <Radio className={`h-4 w-4 ${isAutoEnabled ? 'text-emerald-500 animate-pulse' : 'text-muted-foreground'}`} />
              <div className="flex flex-col">
                <span className="text-xs font-semibold">Real-Time Auto Mitigation</span>
                <span className="text-[10px] text-muted-foreground">
                  {isAutoEnabled ? 'Live auto-triggering on telemetry' : 'Manual triggers only'}
                </span>
              </div>
              <Switch
                checked={isAutoEnabled}
                onCheckedChange={handleToggleAutoMitigation}
                aria-label="Toggle Real-Time Auto Mitigation"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              className="bg-background/80 backdrop-blur-sm gap-1.5 h-9"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Defaults
            </Button>
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="gap-1.5 h-9 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Playbook
            </Button>
          </div>
        </div>

        {/* Navigation Tabs & Metrics */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'playbooks' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('playbooks')}
              className="h-8 gap-2"
            >
              Playbooks
              <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                {activeCount} / {playbooks.length} Active
              </Badge>
            </Button>
            <Button
              variant={activeTab === 'logs' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('logs')}
              className="h-8 gap-1.5"
            >
              <History className="h-3.5 w-3.5" />
              Execution Audit Trail
              {executionLogs.length > 0 && (
                <Badge variant="outline" className="px-1.5 py-0 text-xs font-semibold text-primary">
                  {executionLogs.length}
                </Badge>
              )}
            </Button>
          </div>

          {activeTab === 'logs' && executionLogs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Audit History
            </Button>
          )}
        </div>

        {/* Tab 1: Playbooks Cards Grid */}
        {activeTab === 'playbooks' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {playbooks.map(playbook => (
              <Card
                key={playbook.id}
                className={`flex flex-col justify-between shadow-md border transition-all duration-200 hover:shadow-xl bg-background/85 backdrop-blur-md ${
                  playbook.enabled ? 'border-primary/40' : 'border-border/60 opacity-80'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg font-semibold leading-snug">{playbook.title}</CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="pt-0.5">
                            <Switch
                              checked={playbook.enabled}
                              onCheckedChange={() => handleToggle(playbook.id)}
                              aria-label={`Toggle ${playbook.title}`}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{playbook.enabled ? 'Disable' : 'Enable'} Playbook</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <CardDescription className="text-xs leading-relaxed mt-1">
                    {playbook.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3.5 flex-1">
                  <div>
                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">Trigger Rule</h4>
                    <p className="text-xs bg-muted/60 p-2.5 rounded-md font-mono border text-foreground/90">
                      {playbook.trigger}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Action Pipeline</h4>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {playbook.actions.map((action, index) => (
                        <li key={index} className="flex items-start gap-1.5">
                          <span className="text-primary font-bold">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {playbook.lastRun && (
                    <div className="pt-2 text-[11px] text-muted-foreground flex items-center justify-between border-t border-border/50">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-primary" />
                        Last run: {new Date(playbook.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="font-semibold">Runs: {playbook.runCount || 1}</span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex justify-between items-center border-t pt-3 pb-3 bg-muted/20">
                  <div className="flex items-center gap-1.5">
                    <Badge variant={playbook.enabled ? 'default' : 'outline'} className="gap-1 text-[11px] py-0.5">
                      {playbook.enabled ? <ShieldCheck className="h-3 w-3 text-emerald-400" /> : <ShieldOff className="h-3 w-3 opacity-60" />}
                      {playbook.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => handleOpenEdit(playbook)}
                      title="Edit Playbook"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(playbook.id)}
                      title="Delete Playbook"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    variant={playbook.enabled ? "default" : "secondary"}
                    disabled={runningPlaybookId === playbook.id}
                    onClick={() => handleRunTest(playbook)}
                    className="h-8 gap-1.5 text-xs font-medium shadow-sm"
                  >
                    {runningPlaybookId === playbook.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 text-amber-300" />
                    )}
                    Test Run
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Tab 2: Execution Audit Trail (History) */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {executionLogs.length === 0 ? (
              <Card className="bg-background/85 backdrop-blur-md p-8 text-center border">
                <History className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <h3 className="font-semibold text-lg">No Playbook Executions Recorded</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Click <strong>Test Run</strong> on any playbook card, or trigger security threats (like SQL Injection) with <strong>Real-Time Auto Mitigation</strong> enabled.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {executionLogs.map((log) => (
                  <Card key={log.id} className="bg-background/85 backdrop-blur-md border shadow-sm transition-all hover:border-primary/50">
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <CardTitle className="text-sm font-semibold">{log.playbookTitle}</CardTitle>
                        <Badge
                          variant={log.executionMode === 'Automated (Real-Time)' ? 'default' : 'outline'}
                          className="text-[10px] uppercase font-semibold gap-1"
                        >
                          {log.executionMode === 'Automated (Real-Time)' ? (
                            <>
                              <Zap className="h-2.5 w-2.5 text-amber-300" />
                              Auto Real-Time
                            </>
                          ) : (
                            'Manual Run'
                          )}
                        </Badge>
                        {log.triggerEvent && (
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            {log.triggerEvent}
                          </Badge>
                        )}
                        {log.sourceIp && (
                          <span className="text-xs text-muted-foreground font-mono">
                            Target IP: <code className="text-primary font-semibold">{log.sourceIp}</code>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono text-right shrink-0">
                        <TimeAgo date={log.timestamp} />
                      </div>
                    </CardHeader>
                    <CardContent className="py-2.5 px-4 space-y-2 border-t text-xs">
                      <p className="font-medium text-foreground bg-muted/30 p-2 rounded border font-sans">
                        {log.message}
                      </p>
                      <div>
                        <span className="text-muted-foreground font-semibold">Actions Dispatched:</span>
                        <ul className="list-disc list-inside mt-1 space-y-0.5 text-muted-foreground">
                          {log.actions.map((act, idx) => (
                            <li key={idx} className="text-foreground/80">{act}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create / Edit Playbook Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <form onSubmit={handleSavePlaybook}>
              <DialogHeader>
                <DialogTitle>{editingPlaybook ? 'Edit Automated Playbook' : 'Create New Playbook'}</DialogTitle>
                <DialogDescription>
                  Configure the trigger condition and mitigation actions for this automated security workflow.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="title">Playbook Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Block Compromised User Session"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this automated response handles..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="trigger">Trigger Rule / Condition</Label>
                  <Input
                    id="trigger"
                    placeholder="e.g. Alert severity is High AND anomalyScore > 0.85"
                    value={formTrigger}
                    onChange={(e) => setFormTrigger(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="actions">Actions (one action per line)</Label>
                  <Textarea
                    id="actions"
                    placeholder={"Revoke active session token.\nNotify security operations team via Slack.\nInitiate password reset."}
                    value={formActions}
                    onChange={(e) => setFormActions(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPlaybook ? 'Save Changes' : 'Create Playbook'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
