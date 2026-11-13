import type { LogEvent } from '@/types';

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
  sourceIp?: string;
  triggerEvent?: string;
  executionMode?: 'Manual' | 'Automated (Real-Time)';
};

export const INITIAL_PLAYBOOKS: Playbook[] = [
  {
    id: "pb-1",
    title: "Block Known Malicious IP",
    description: "Automatically block IP addresses that are identified as known threats by the threat intelligence service.",
    trigger: "Alert severity is High AND Threat Intel reports Known Threat.",
    actions: ["Add IP to firewall blocklist.", "Create high-priority ticket in Jira."],
    enabled: true,
    runCount: 0,
  },
  {
    id: "pb-2",
    title: "Isolate Suspicious Instance",
    description: "If an instance shows repeated high-anomaly behavior, isolate it from the network for forensic analysis.",
    trigger: "More than 5 High-severity alerts for the same server within 1 hour.",
    actions: ["Apply 'quarantine' security group to instance.", "Snapshot instance EBS volume.", "Alert on-call SRE."],
    enabled: true,
    runCount: 0,
  },
  {
    id: "pb-3",
    title: "De-escalate Low-Severity Alerts",
    description: "Automatically close low-severity alerts that are not associated with any known threat to reduce analyst noise.",
    trigger: "Alert severity is Low AND Threat Intel reports No Threat.",
    actions: ["Mark alert as 'resolved'.", "Log event for trend analysis."],
    enabled: true,
    runCount: 0,
  },
  {
    id: "pb-4",
    title: "Create Investigation Ticket",
    description: "Creates a standard investigation ticket in the connected ticketing system for any Medium-severity alert.",
    trigger: "Alert severity is Medium.",
    actions: ["Create ticket in Jira.", "Assign to Tier-1 Analyst queue."],
    enabled: true,
    runCount: 0,
  },
];

const PLAYBOOKS_STORAGE_KEY = 'cloud_sentinel_playbooks';
const HISTORY_STORAGE_KEY = 'cloud_sentinel_playbook_history';
const AUTO_MITIGATION_STORAGE_KEY = 'cloud_sentinel_auto_playbooks';

let memoryPlaybooks: Playbook[] = INITIAL_PLAYBOOKS;
let memoryHistory: ExecutionLog[] = [];
let memoryAutoMitigation = true;

export function getStoredPlaybooks(): Playbook[] {
  if (typeof window === 'undefined') {
    return memoryPlaybooks;
  }
  try {
    const raw = localStorage.getItem(PLAYBOOKS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PLAYBOOKS_STORAGE_KEY, JSON.stringify(INITIAL_PLAYBOOKS));
      return INITIAL_PLAYBOOKS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PLAYBOOKS;
  } catch (e) {
    console.error('Error reading playbooks from storage:', e);
    return INITIAL_PLAYBOOKS;
  }
}

export function saveStoredPlaybooks(playbooks: Playbook[]): void {
  memoryPlaybooks = playbooks;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PLAYBOOKS_STORAGE_KEY, JSON.stringify(playbooks));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('cloudsentinel-playbook-update'));
  } catch (e) {
    console.error('Error saving playbooks to storage:', e);
  }
}

export function getPlaybookHistory(): ExecutionLog[] {
  if (typeof window === 'undefined') return memoryHistory;
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading playbook history:', e);
    return [];
  }
}

export function recordPlaybookExecution(log: ExecutionLog): ExecutionLog[] {
  const current = getPlaybookHistory();
  const updated = [log, ...current].slice(0, 50);
  memoryHistory = updated;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('cloudsentinel-playbook-update'));
    } catch (e) {
      console.error('Error saving playbook execution log:', e);
    }
  }
  return updated;
}

export function clearPlaybookHistory(): void {
  memoryHistory = [];
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('cloudsentinel-playbook-update'));
  } catch (e) {
    console.error('Error clearing playbook history:', e);
  }
}

export function isAutoMitigationEnabled(): boolean {
  if (typeof window === 'undefined') return memoryAutoMitigation;
  return localStorage.getItem(AUTO_MITIGATION_STORAGE_KEY) !== 'false';
}

export function setAutoMitigationEnabled(enabled: boolean): void {
  memoryAutoMitigation = enabled;
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTO_MITIGATION_STORAGE_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('cloudsentinel-playbook-update'));
}

export function executePlaybookLocally(
  playbookId: string,
  options?: {
    sourceIp?: string;
    triggerEvent?: string;
    mode?: 'Manual' | 'Automated (Real-Time)';
    customMessage?: string;
  }
): { success: boolean; log: ExecutionLog } {
  const playbooks = getStoredPlaybooks();
  const target = playbooks.find((pb) => pb.id === playbookId);

  const timestamp = new Date().toISOString();
  const mode = options?.mode || 'Manual';
  const sourceIp = options?.sourceIp || '198.51.100.42';
  const triggerEvent = options?.triggerEvent || 'Trigger Condition Met';

  const defaultMessages: Record<string, string> = {
    'pb-1': `Firewall rule deployed: Inbound traffic from ${sourceIp} has been dropped at Cloud WAF perimeter; Jira emergency incident ticket #SEC-${Math.floor(1000 + Math.random() * 9000)} created.`,
    'pb-2': `Host containment initiated: Target instance placed in quarantine security group 'sg-quarantine-01'; EBS volume forensic snapshot triggered.`,
    'pb-3': `Alert de-escalation confirmed: Low-severity anomalous activity from ${sourceIp} marked resolved and archived to baseline compliance ledger.`,
    'pb-4': `Investigation workflow: High-priority triage ticket created in Jira and routed to Tier-1 SOC operational queue.`,
  };

  const message =
    options?.customMessage ||
    defaultMessages[playbookId] ||
    `Workflow "${target?.title || playbookId}" executed all ${target?.actions.length || 0} automated actions successfully.`;

  // Update playbook metadata
  const updatedPlaybooks = playbooks.map((pb) =>
    pb.id === playbookId
      ? {
          ...pb,
          lastRun: timestamp,
          runCount: (pb.runCount || 0) + 1,
        }
      : pb
  );
  saveStoredPlaybooks(updatedPlaybooks);

  const newLog: ExecutionLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    playbookId,
    playbookTitle: target?.title || 'Automated Playbook',
    timestamp,
    status: 'Success',
    message,
    actions: target?.actions || ['Execute automated response step.'],
    sourceIp,
    triggerEvent,
    executionMode: mode,
  };

  recordPlaybookExecution(newLog);

  return { success: true, log: newLog };
}

/**
 * Evaluates real-time events and executes matching enabled playbooks automatically.
 */
export function evaluateRealtimePlaybookTriggers(event: LogEvent): ExecutionLog | null {
  if (!isAutoMitigationEnabled()) return null;

  const playbooks = getStoredPlaybooks();

  // Condition 1: SQL Injection or Critical High-Severity Anomaly
  if (
    event.action === 'AUTH_LOGIN_SQL_INJECTION' ||
    (event.anomalyScore >= 0.9 && event.status === 'Success')
  ) {
    const pb1 = playbooks.find((pb) => pb.id === 'pb-1' && pb.enabled);
    if (pb1) {
      const res = executePlaybookLocally('pb-1', {
        sourceIp: event.sourceIp,
        triggerEvent: event.action,
        mode: 'Automated (Real-Time)',
        customMessage: `Automated Real-Time Mitigation: Blocked malicious source IP ${event.sourceIp} at cloud edge following ${event.action} (Anomaly Score: ${event.anomalyScore.toFixed(2)}). Jira ticket created.`,
      });
      return res.log;
    }
  }

  // Condition 2: Privilege Escalation or Tampering
  if (event.action === 'PRIV_ESCALATION' || event.action === 'SECURITY_LOG_DISABLED') {
    const pb2 = playbooks.find((pb) => pb.id === 'pb-2' && pb.enabled);
    if (pb2) {
      const res = executePlaybookLocally('pb-2', {
        sourceIp: event.sourceIp,
        triggerEvent: event.action,
        mode: 'Automated (Real-Time)',
        customMessage: `Automated Real-Time Mitigation: Quarantined affected compute resources and initiated EBS snapshot due to ${event.action} by ${event.sourceIp}.`,
      });
      return res.log;
    }
  }

  // Condition 3: Medium severity anomalies
  if (event.anomalyScore >= 0.75 && event.anomalyScore < 0.9) {
    const pb4 = playbooks.find((pb) => pb.id === 'pb-4' && pb.enabled);
    if (pb4) {
      const res = executePlaybookLocally('pb-4', {
        sourceIp: event.sourceIp,
        triggerEvent: event.action,
        mode: 'Automated (Real-Time)',
      });
      return res.log;
    }
  }

  return null;
}
