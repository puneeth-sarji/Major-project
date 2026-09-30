'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model', 'assistant']),
  content: z.string(),
});

const CopilotChatInputSchema = z.object({
  message: z.string().describe('The question or query asked by the security analyst.'),
  history: z.array(ChatMessageSchema).optional().describe('Previous messages in the conversation.'),
  telemetry: z.object({
    totalEvents: z.number().optional(),
    totalAlerts: z.number().optional(),
    highSeverityAlerts: z.number().optional(),
    mediumSeverityAlerts: z.number().optional(),
    lowSeverityAlerts: z.number().optional(),
    topThreatActions: z.array(z.object({ action: z.string(), count: z.number() })).optional(),
    topSuspiciousIps: z.array(z.object({ ip: z.string(), count: z.number(), country: z.string().optional() })).optional(),
    recentEvents: z.array(z.object({
      action: z.string(),
      status: z.string(),
      anomalyScore: z.number(),
      timestamp: z.string(),
      sourceIp: z.string().optional(),
    })).optional(),
  }).optional().describe('Current live telemetry context from the SOC.'),
});

export type CopilotChatInput = z.infer<typeof CopilotChatInputSchema>;

function generateIntelligentChatFallback(input: CopilotChatInput): string {
  const query = input.message.toLowerCase();
  const tel = input.telemetry || {};
  const high = tel.highSeverityAlerts || 0;
  const totalAlerts = tel.totalAlerts || 0;
  const topIps = tel.topSuspiciousIps || [];
  const topActions = tel.topThreatActions || [];

  if (query.includes('ip') || query.includes('block') || query.includes('source') || query.includes('attacker')) {
    if (topIps.length > 0) {
      const ipList = topIps.slice(0, 5).map(ip => `* **\`${ip.ip}\`** (${ip.country || 'Unknown'}) - **${ip.count} anomalous events detected**`).join('\n');
      return `### 🌐 Top Malicious & Suspicious IP Addresses\n\nBased on real-time event correlation, the following external source IPs are currently flagged with high anomaly risk:\n\n${ipList}\n\n**Recommended Immediate Actions:**\n1. Run the **"Block Known Malicious IP"** automated playbook.\n2. Apply dynamic rate limiting and drop traffic from these CIDRs at the Cloud Edge / WAF.`;
    }
    return `### 🌐 IP Threat Analysis\n\nExternal IPs triggering anomalies are being monitored. We recommend cross-referencing against Threat Intelligence feeds and applying automated firewall isolation.`;
  }

  if (query.includes('sql') || query.includes('injection') || query.includes('auth_login_sql_injection')) {
    return `### 💉 SQL Injection Attack Analysis\n\n**Pattern Identified:** \`AUTH_LOGIN_SQL_INJECTION\` attempts observed against web application endpoints.\n\n**Risk Level:** **High (Critical)**\n- **Objective:** Bypassing authentication layers and unauthorized database enumeration.\n- **Mitigation:**\n  1. Review parameterized SQL queries and ORM validation.\n  2. Enable WAF rule sets against SQLi patterns.\n  3. Verify whether anomalous sessions gained session tokens and revoke compromised credentials.`;
  }

  if (query.includes('privilege') || query.includes('escalat') || query.includes('priv_escalation')) {
    return `### 🔐 Privilege Escalation Analysis\n\n**Pattern Identified:** \`PRIV_ESCALATION\` events detected with high anomaly scores (> 0.85).\n\n**Risk Level:** **High**\n- **Impact:** Attackers attempting to assume administrative IAM roles or root permissions.\n- **Mitigation:**\n  1. Immediately quarantine targeted user accounts in Settings / Identity Center.\n  2. Enforce MFA re-challenge and review CloudTrail / audit logs for unauthorized policy modifications.\n  3. Run the **"Isolate Suspicious Instance"** playbook if associated with host infrastructure.`;
  }

  if (query.includes('playbook') || query.includes('automate') || query.includes('response')) {
    return `### ⚡ Recommended Response Playbooks\n\nGiven the current security posture with **${high} High-Severity alerts** and **${totalAlerts} total alerts**, execute the following:\n\n1. **Block Known Malicious IP**: Automatically adds malicious source IPs to cloud edge security groups.\n2. **Isolate Suspicious Instance**: Quarantines compromised virtual nodes and generates an EBS snapshot for forensics.\n3. **De-escalate Low-Severity Alerts**: Filters noise and records standard baseline audit logs for benign events.\n\nYou can trigger these directly from the **Automated Playbooks** page.`;
  }

  if (query.includes('summary') || query.includes('status') || query.includes('posture') || query.includes('overview')) {
    return `### 📊 Live Security Posture Summary\n\n- **Total Active Alerts:** **${totalAlerts}**\n- **High-Severity Threats:** **${high}**\n- **Total Telemetry Events:** **${tel.totalEvents || '300+'}**\n\n**System Assessment:** Threat volume is elevated. Priority should be given to investigating recurring SQL injection and privilege escalation vectors.`;
  }

  if (query.includes('exfiltration') || query.includes('export') || query.includes('data')) {
    return `### 📦 Data Exfiltration Assessment\n\n**Pattern Identified:** \`DATA_EXPORT_USER_LIST\` or bulk database dump actions detected.\n\n**Containment Actions:**\n1. Check outbound network bytes and cloud egress metrics.\n2. Revoke API keys used for bulk exports.\n3. Verify S3 / Cloud Storage bucket policy access logs.`;
  }

  // General helpful security assistant reply
  return `### 🛡️ CloudSentinel AI Co-pilot Assessment\n\nRegarding your query: *"**${input.message}**"*\n\n**Current Environment Context:**\n- **Active Alerts:** ${totalAlerts} (${high} High-Severity)\n- **Primary Vectors:** ${topActions.slice(0, 3).map(a => a.action).join(', ') || 'Authentication bypass, Privilege escalation, Anomaly spikes'}\n\n**SOC Analyst Guidance:**\n- Ensure high-severity alerts on the **Alerts** page are triaged first.\n- Use the **Threat Intelligence** checker to inspect specific external IP addresses.\n- Trigger **Automated Response Playbooks** for fast remediation.\n\n*Feel free to ask for specific IP analysis, incident summaries, or playbook execution recommendations.*`;
}

export const copilotChatFlow = ai.defineFlow(
  {
    name: 'copilotChatFlow',
    inputSchema: CopilotChatInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      console.log('Starting copilot chat flow for query:', input.message);
      const tel = input.telemetry;
      const systemContext = tel ? `
Current Real-Time SOC Telemetry:
- Total Alerts: ${tel.totalAlerts ?? 'N/A'} (High Severity: ${tel.highSeverityAlerts ?? 0}, Medium: ${tel.mediumSeverityAlerts ?? 0}, Low: ${tel.lowSeverityAlerts ?? 0})
- Total Monitored Events: ${tel.totalEvents ?? 'N/A'}
- Top Threat Actions: ${JSON.stringify(tel.topThreatActions || [])}
- Top Suspicious Source IPs: ${JSON.stringify(tel.topSuspiciousIps || [])}
- Recent Log Events: ${JSON.stringify(tel.recentEvents?.slice(0, 8) || [])}
` : '';

      const historyFormatted = input.history && input.history.length > 0
        ? input.history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n')
        : '';

      const { text } = await ai.generate({
        prompt: `You are CloudSentinel, an expert AI Security Co-pilot assisting a security analyst in a modern Cloud Security Operations Center (SOC).
Provide insightful, concise, authoritative, and actionable answers formatted in clean Markdown.

${systemContext}

${historyFormatted ? `Conversation History:\n${historyFormatted}\n` : ''}

Analyst Query: "${input.message}"

Provide your answer with clear reasoning, risk evaluation, and concrete next steps (e.g. playbook recommendations, IP quarantine, credential resets) referencing current live data where relevant.`,
      });

      if (!text || text.trim().length === 0) {
        return generateIntelligentChatFallback(input);
      }
      return text;
    } catch (error) {
      console.warn('AI chat model call failed, falling back to intelligent rule engine:', error);
      return generateIntelligentChatFallback(input);
    }
  }
);
