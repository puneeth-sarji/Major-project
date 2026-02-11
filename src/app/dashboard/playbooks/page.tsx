'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { runPlaybookAction } from "../actions";
import { useState } from "react";
import { Loader2, ShieldCheck, ShieldOff, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import dynamic from 'next/dynamic'; // Import dynamic

// Dynamically import LetterGlitch to ensure it's client-side rendered
const LetterGlitch = dynamic(() => import('@/components/LetterGlitch'), {
  ssr: false, // Ensure this component is only rendered on the client side
});

export type Playbook = {
  id: string;
  title: string;
  description: string;
  trigger: string;
  actions: string[];
  enabled: boolean;
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
  const [runningPlaybookId, setRunningPlaybookId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleToggle = (playbookId: string) => {
    setPlaybooks(prev => prev.map(pb => pb.id === playbookId ? { ...pb, enabled: !pb.enabled } : pb));
  };
  
  const handleRunTest = async (playbook: Playbook) => {
    setRunningPlaybookId(playbook.id);
    try {
        const result = await runPlaybookAction(playbook.id, playbook.title);
        if (result.success) {
            toast({
                title: "Playbook Test Successful",
                description: result.message,
            });
        } else {
             toast({
                variant: "destructive",
                title: "Playbook Test Failed",
                description: result.error,
            });
        }
    } finally {
        setRunningPlaybookId(null);
    }
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={false}
          smooth={true}
          className="w-full h-full"
        />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen gap-8 p-6 animate-in">
        <div className="grid gap-1 rounded-lg bg-background/80 p-2 backdrop-blur-sm w-fit">
          <h1 className="text-3xl font-bold tracking-tight">Automated Response Playbooks</h1>
          <p className="text-muted-foreground">
            Define automated workflows to respond to threats in real-time.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {playbooks.map(playbook => (
            <Card key={playbook.id} className="flex flex-col justify-between shadow-lg border-primary/20 hover:border-primary/50 transition-all hover:shadow-xl bg-background/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{playbook.title}</CardTitle>
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Switch
                                  checked={playbook.enabled}
                                  onCheckedChange={() => handleToggle(playbook.id)}
                                  aria-label={`Enable ${playbook.title}`}
                              />
                          </TooltipTrigger>
                          <TooltipContent>
                              <p>{playbook.enabled ? 'Disable' : 'Enable'} Playbook</p>
                          </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
                </div>
                <CardDescription>{playbook.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Trigger</h4>
                  <p className="text-xs text-muted-foreground bg-secondary p-2 rounded-md font-mono">{playbook.trigger}</p>
                </div>
                 <div>
                  <h4 className="font-semibold text-sm mb-1">Actions</h4>
                  <ul className="space-y-1 list-disc list-inside text-xs text-muted-foreground">
                    {playbook.actions.map((action, index) => <li key={index}>{action}</li>)}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center border-t pt-4">
                 <Badge variant={playbook.enabled ? 'default' : 'outline'}>
                  {playbook.enabled ? <ShieldCheck className="mr-1 h-3 w-3" /> : <ShieldOff className="mr-1 h-3 w-3" />}
                  {playbook.enabled ? 'Active' : 'Inactive'}
                 </Badge>
                 <Button size="sm" variant="ghost" disabled={!!runningPlaybookId} onClick={() => handleRunTest(playbook)}>
                  {runningPlaybookId === playbook.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                   Test Run
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}