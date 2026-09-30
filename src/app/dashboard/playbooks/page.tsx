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
import { runPlaybookAction } from "../actions";
import { Loader2, ShieldCheck, ShieldOff, Zap, Plus, Pencil, Trash2, RotateCcw, History, CheckCircle2, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import dynamic from 'next/dynamic';

const LetterGlitch = dynamic(() => import('@/components/LetterGlitch'), {
  ssr: false,
});

export type Playbook = {
  id: string;
  title: string;
  description: string;
  trigger: string;
  actions: string[];
  enabled: boolean;
  lastRun?: string;
  runCount?: number;
};

export type ExecutionLog = {
  id: string;
  playbookId: string;
  playbookTitle: string;
  timestamp: string;
  status: 'Success' | 'Simulated' | 'Failed';
  message: string;
  actions: string[];
};

export const initialPlaybooks: Playbook[] = [
  {
    id: "pb-1",
    title: "Block Known Malicious IP",
    description: "Automatically block IP addresses that are identified as known threats by the threat intelligence service.",
    trigger: "Alert severity is High AND Threat Intel reports Known Threat.",
    actions: ["Add IP to firewall blocklist.", "Create high-priority ticket in Jira."],
    enabled: true,
  },
  {
    id: "pb-2",
    title: "Isolate Suspicious Instance",
    description: "If an instance shows repeated high-anomaly behavior, isolate it from the network for forensic analysis.",
    trigger: "More than 5 High-severity alerts for the same server within 1 hour.",
    actions: ["Apply 'quarantine' security group to instance.", "Snapshot instance EBS volume.", "Alert on-call SRE."],
    enabled: false,
  },
  {
    id: "pb-3",
    title: "De-escalate Low-Severity Alerts",
    description: "Automatically close low-severity alerts that are not associated with any known threat to reduce analyst noise.",
    trigger: "Alert severity is Low AND Threat Intel reports No Threat.",
    actions: ["Mark alert as 'resolved'.", "Log event for trend analysis."],
    enabled: true,
  },
  {
    id: "pb-4",
    title: "Create Investigation Ticket",
    description: "Creates a standard investigation ticket in the connected ticketing system for any Medium-severity alert.",
    trigger: "Alert severity is Medium.",
    actions: ["Create ticket in Jira.", "Assign to Tier-1 Analyst queue."],
    enabled: true,
  },
];

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>(initialPlaybooks);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
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

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedPb = localStorage.getItem('cloud_sentinel_playbooks');
      if (storedPb) {
        setPlaybooks(JSON.parse(storedPb));
      } else {
        localStorage.setItem('cloud_sentinel_playbooks', JSON.stringify(initialPlaybooks));
      }

      const storedLogs = localStorage.getItem('cloud_sentinel_playbook_history');
      if (storedLogs) {
        setExecutionLogs(JSON.parse(storedLogs));
      }
    } catch (e) {
      console.error('Error loading stored playbooks:', e);
    }
  }, []);

  const savePlaybooks = (updated: Playbook[]) => {
    setPlaybooks(updated);
    try {
      localStorage.setItem('cloud_sentinel_playbooks', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving playbooks:', e);
    }
  };

  const addExecutionLog = (log: ExecutionLog) => {
    const updated = [log, ...executionLogs].slice(0, 50);
    setExecutionLogs(updated);
    try {
      localStorage.setItem('cloud_sentinel_playbook_history', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving logs:', e);
    }
  };

  const handleToggle = (playbookId: string) => {
    const target = playbooks.find(pb => pb.id === playbookId);
    const newStatus = target ? !target.enabled : false;
    const updated = playbooks.map(pb => pb.id === playbookId ? { ...pb, enabled: newStatus } : pb);
    savePlaybooks(updated);

    toast({
      title: newStatus ? "Playbook Activated" : "Playbook Deactivated",
      description: `"${target?.title}" is now ${newStatus ? 'active' : 'inactive'}. Changes saved.`,
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

    if (editingPlaybook) {
      const updated = playbooks.map(pb => pb.id === editingPlaybook.id ? {
        ...pb,
        title: formTitle.trim(),
        description: formDesc.trim(),
        trigger: formTrigger.trim(),
        actions: actionList.length > 0 ? actionList : ['Perform automated response.'],
      } : pb);
      savePlaybooks(updated);
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
      savePlaybooks([...playbooks, newPb]);
      toast({
        title: "Playbook Created",
        description: `New playbook "${formTitle}" is active.`,
      });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (playbookId: string) => {
    const target = playbooks.find(pb => pb.id === playbookId);
    const updated = playbooks.filter(pb => pb.id !== playbookId);
    savePlaybooks(updated);
    toast({
      title: "Playbook Removed",
      description: `"${target?.title}" has been deleted.`,
    });
  };

  const handleResetDefaults = () => {
    savePlaybooks(initialPlaybooks);
    toast({
      title: "Defaults Restored",
      description: "Playbooks have been reset to factory defaults.",
    });
  };

  const handleRunTest = async (playbook: Playbook) => {
    setRunningPlaybookId(playbook.id);
    try {
      const result = await runPlaybookAction(playbook.id, playbook.title);
      const timestamp = new Date().toISOString();

      if (result.success) {
        const updated = playbooks.map(pb => pb.id === playbook.id ? {
          ...pb,
          lastRun: timestamp,
          runCount: (pb.runCount || 0) + 1,
        } : pb);
        savePlaybooks(updated);

        addExecutionLog({
          id: `log-${Date.now()}`,
          playbookId: playbook.id,
          playbookTitle: playbook.title,
          timestamp,
          status: 'Success',
          message: result.message || 'Workflow executed successfully.',
          actions: playbook.actions,
        });

        toast({
          title: "Playbook Execution Successful",
          description: result.message,
        });
      } else {
        const errorMsg = 'error' in result ? (result.error as string) : 'Execution encountered an error.';
        addExecutionLog({
          id: `log-${Date.now()}`,
          playbookId: playbook.id,
          playbookTitle: playbook.title,
          timestamp,
          status: 'Failed',
          message: errorMsg,
          actions: playbook.actions,
        });

        toast({
          variant: "destructive",
          title: "Playbook Execution Failed",
          description: errorMsg,
        });
      }
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
              Define, configure, and test real-time automated workflows to instantly mitigate security threats.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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
                <Badge variant="outline" className="px-1.5 py-0 text-xs">
                  {executionLogs.length}
                </Badge>
              )}
            </Button>
          </div>
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
                      <span>Last run: {new Date(playbook.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>Total runs: {playbook.runCount || 1}</span>
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
                    className="h-8 gap-1.5 text-xs"
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

        {/* Tab 2: Execution Audit Trail */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {executionLogs.length === 0 ? (
              <Card className="bg-background/85 backdrop-blur-md p-8 text-center border">
                <History className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <h3 className="font-semibold text-lg">No Executions Recorded Yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Click <strong>Test Run</strong> on any automated playbook card to simulate and test real-time security actions.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {executionLogs.map((log) => (
                  <Card key={log.id} className="bg-background/85 backdrop-blur-md border shadow-sm">
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <CardTitle className="text-sm font-semibold">{log.playbookTitle}</CardTitle>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {log.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </CardHeader>
                    <CardContent className="py-2 px-4 space-y-2 border-t text-xs">
                      <p className="font-medium text-foreground">{log.message}</p>
                      <div>
                        <span className="text-muted-foreground font-semibold">Actions Dispatched:</span>
                        <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-muted-foreground">
                          {log.actions.map((act, idx) => (
                            <li key={idx}>{act}</li>
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