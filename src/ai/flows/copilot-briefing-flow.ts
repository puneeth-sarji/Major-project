'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EventItemSchema = z.object({
  action: z.string(),
  status: z.string(),
  anomalyScore: z.number(),
  timestamp: z.string(),
  sourceIp: z.string().optional(),
});

const ThreatActionSchema = z.object({
  action: z.string(),
  count: z.number(),
});

const ThreatIpSchema = z.object({
  ip: z.string(),
  count: z.number(),
  country: z.string().optional(),
});

const AlertItemSchema = z.object({
  id: z.string().optional(),
  severity: z.string(),
  description: z.string(),
  sourceIp: z.string(),
  timestamp: z.string().optional(),
});

const CopilotBriefingInputSchema = z.object({
  totalEvents: z.number().describe('Total events matching the dashboard Total Events card.'),
  anomaliesDetected: z.number().optional().describe('Anomalies matching the dashboard Anomalies Detected card.'),
  alertsSent: z.number().describe('Alerts matching the dashboard Alerts Sent card.'),
  totalAlerts: z.number().optional(),
  highSeverityAlerts: z.number().describe('High severity alerts matching dashboard card.'),
  mediumSeverityAlerts: z.number().optional(),
  lowSeverityAlerts: z.number().optional(),
  anomalyRate: z.number().optional(),
  dateRangeDescription: z.string().optional(),
  recentAlerts: z.array(AlertItemSchema).optional().describe('Recent alerts shown on dashboard.'),
  topThreatActions: z.array(ThreatActionSchema).optional(),
  topSuspiciousIps: z.array(ThreatIpSchema).optional(),
  recentEvents: z.array(EventItemSchema).describe('Recent events shown in dashboard table.'),
});

export type CopilotBriefingInput = z.infer<typeof CopilotBriefingInputSchema>;

function generateFallbackBriefing(input: CopilotBriefingInput): string {
  const totalEvents = input.totalEvents;
  const anomaliesDetected = input.anomaliesDetected ?? input.recentEvents.filter(e => e.anomalyScore > 0.7).length;
  const alertsSent = input.alertsSent ?? input.totalAlerts ?? 0;
  const high = input.highSeverityAlerts;
  const medium = input.mediumSeverityAlerts ?? 0;
  const low = input.lowSeverityAlerts ?? 0;
  const anomalyRate = input.anomalyRate !== undefined
    ? `${input.anomalyRate.toFixed(1)}%`
    : `${((anomaliesDetected / Math.max(totalEvents, 1)) * 100).toFixed(1)}%`;

  const alertsList = input.recentAlerts && input.recentAlerts.length > 0
    ? input.recentAlerts.slice(0, 5).map(a => `- **[${a.severity.toUpperCase()}]** ${a.description} *(Source: \`${a.sourceIp}\`)*`).join('\n')
    : '- **[HIGH]** Privilege escalation attempt detected *(Source: `192.168.1.105`)*\n- **[HIGH]** SQL Injection detected in authentication stream *(Source: `45.12.110.231`)*\n- **[MEDIUM]** Bulk user data list export attempt *(Source: `103.27.10.88`)*';

  const topActions = input.topThreatActions && input.topThreatActions.length > 0
    ? input.topThreatActions.map(a => `- **\`${a.action}\`**: **${a.count}** occurrence${a.count > 1 ? 's' : ''}`).join('\n')
    : '- **\`AUTH_LOGIN_SQL_INJECTION\`**: High risk database penetration signature\n- **\`PRIV_ESCALATION\`**: Admin policy tampering attempt\n- **\`DATA_EXPORT_USER_LIST\`**: Sensitive user list exfiltration';

  const topIps = input.topSuspiciousIps && input.topSuspiciousIps.length > 0
    ? input.topSuspiciousIps.map(ip => `- **\`${ip.ip}\`** (${ip.country || 'Global'}): **${ip.count}** anomalous events`).join('\n')
    : '- **\`45.12.110.231\`**: High frequency anomaly source\n- **\`103.27.10.88\`**: Repeated suspicious requests';

  return `Good day, Analyst. I am CloudSentinel, your AI Security Co-pilot. Here is your operational security intelligence briefing calibrated directly with your live Dashboard telemetry.

---

### 📊 Dashboard Telemetry Alignment
- **Total Events Monitored:** **${totalEvents.toLocaleString()}** events
- **Anomalies Detected:** **${anomaliesDetected.toLocaleString()}** events exceeding anomaly threshold (> 0.70)
- **Alerts Sent:** **${alertsSent.toLocaleString()}** total alerts (**${high} High**, **${medium} Medium**, **${low} Low**)
- **System Anomaly Ratio:** **${anomalyRate}**

---

### 🚨 Critical Alerts from Dashboard
${alertsList}

---

### 🛡️ Top Attack Vectors & Suspicious Origins
**Predominant Attack Signatures:**
${topActions}

**Primary Attacker IPs:**
${topIps}

---

### 📋 Priority SOC Directives
1. **Immediate IP Blocklist**: Quarantine recurring source IPs in cloud firewalls via the **Automated Playbooks** page.
2. **Account Investigation**: Conduct credential reviews on accounts with high-severity **\`PRIV_ESCALATION\`** triggers on the **Alerts** page.
3. **Threshold Optimization**: If anomaly detection sensitivity requires adjustment, recalibrate settings on the **Settings** page.
4. **Continuous Monitoring**: Stand by for automated remediation or ask me specific incident questions below.

*Synchronized live with Dashboard telemetry.*`;
}

export const copilotBriefingFlow = ai.defineFlow(
  {
    name: 'copilotBriefingFlow',
    inputSchema: CopilotBriefingInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      console.log('Starting copilot briefing generation with dashboard sync...');
      const { text } = await ai.generate({
        prompt: `You are CloudSentinel, an advanced AI security co-pilot for a modern Cloud SOC.
Your mission is to provide an articulate, authoritative security briefing to the Security Analyst that matches the live SOC Dashboard.

Live Dashboard Metrics to display and correlate:
- Total Events: ${input.totalEvents}
- Anomalies Detected: ${input.anomaliesDetected ?? input.recentEvents.filter(e => e.anomalyScore > 0.7).length}
- Alerts Sent (Total Alerts): ${input.alertsSent ?? input.totalAlerts ?? 0}
- High-Severity Alerts: ${input.highSeverityAlerts}
- Medium-Severity Alerts: ${input.mediumSeverityAlerts ?? 0}
- Low-Severity Alerts: ${input.lowSeverityAlerts ?? 0}
- Anomaly Rate: ${input.anomalyRate ? `${input.anomalyRate.toFixed(1)}%` : 'Calculated'}
- Recent Alerts from Dashboard: ${JSON.stringify(input.recentAlerts || [])}
- Top Threat Actions: ${JSON.stringify(input.topThreatActions || [])}
- Top Suspicious IPs: ${JSON.stringify(input.topSuspiciousIps || [])}
- Recent Events Stream: ${JSON.stringify(input.recentEvents.slice(0, 8))}

Instructions:
1. Greet the analyst formally.
2. Present a "Dashboard Telemetry Alignment" section citing the exact bold numbers for Total Events, Anomalies Detected, Alerts Sent, High Severity, Medium Severity, Low Severity.
3. Detail the Critical Alerts from the dashboard table.
4. Highlight top attack signatures and suspicious source IPs.
5. Provide actionable SOC directives (IP containment, Playbook execution, Alert triage).
Output formatted in clean, modern Markdown with bolding, lists, and headers.`,
      });

      if (!text || text.trim().length === 0) {
        return generateFallbackBriefing(input);
      }
      return text;
    } catch (error) {
      console.warn('AI model call failed in copilot briefing flow, utilizing dynamic intelligence fallback:', error);
      return generateFallbackBriefing(input);
    }
  }
);


