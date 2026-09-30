
'use server';

import { getThreatIntelligence } from "@/ai/flows/threat-intelligence-flow";
import { handleAlertFeedback } from "@/ai/flows/alert-feedback-flow";
import type { Alert, LogEvent } from "@/types";
import { revalidatePath } from "next/cache";
import { summarizeAndAdviseOnAlert } from "@/ai/flows/summarize-and-advise-flow";
import { getMockLogEvents } from "@/lib/mock-data";
import { copilotBriefingFlow } from '@/ai/flows/copilot-briefing-flow';
import { copilotChatFlow } from '@/ai/flows/copilot-chat-flow';
import { getMockAlerts } from '@/lib/mock-data';
import { executePlaybook } from '@/ai/flows/automated-response-playbook-flow';
import { adjustAnomalyDetectionSensitivity } from '@/ai/flows/adjustable-anomaly-detection-sensitivity';


// Alerts Actions
export async function checkThreatIntelligence(ipAddress: string) {
    try {
        const result = await getThreatIntelligence({ ipAddress });
        return result;
    } catch (error) {
        console.error('Error fetching threat intelligence:', error);
        return { isKnownThreat: false, details: 'Error fetching intelligence.' };
    }
}

export async function getIncidentAnalysis(alert: Alert) {
    try {
        const result = await summarizeAndAdviseOnAlert({
            alert,
        });
        
        return { success: true, analysis: result };
    } catch (error) {
        console.error('Error fetching incident analysis:', error);
        return { success: false, error: 'Failed to generate AI analysis. Please try again.' };
    }
}


export async function handleAlertFeedbackAction(input: {
  alertId: string;
  feedback: 'confirm' | 'dismiss';
  currentThreshold: number;
}) {
  try {
    const result = await handleAlertFeedback({
      feedback: input.feedback,
      currentThreshold: input.currentThreshold,
    });
    
    if (result && typeof result.newThreshold === 'number') {
      revalidatePath('/dashboard/settings');
      return { success: true, newThreshold: result.newThreshold };
    } else {
      throw new Error('AI flow did not return the expected result.');
    }
  } catch (error) {
    console.error('Error handling alert feedback:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}

// Helper to build telemetry summaries from events
function summarizeTelemetry(events: LogEvent[]) {
  const allAlerts = getMockAlerts(events);
  const highSeverityAlerts = allAlerts.filter(a => a.severity === 'High').length;
  const mediumSeverityAlerts = allAlerts.filter(a => a.severity === 'Medium').length;
  const lowSeverityAlerts = allAlerts.filter(a => a.severity === 'Low').length;
  const anomaliesDetected = events.filter(e => e.anomalyScore > 0.7).length;

  // Aggregate top threat actions
  const actionCounts: Record<string, number> = {};
  const ipCounts: Record<string, { count: number; country: string }> = {};

  for (const ev of events) {
    if (ev.anomalyScore > 0.7) {
      actionCounts[ev.action] = (actionCounts[ev.action] || 0) + 1;
      if (ev.sourceIp) {
        if (!ipCounts[ev.sourceIp]) {
          ipCounts[ev.sourceIp] = { count: 0, country: ev.country || 'Unknown' };
        }
        ipCounts[ev.sourceIp].count += 1;
      }
    }
  }

  const topThreatActions = Object.entries(actionCounts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topSuspiciousIps = Object.entries(ipCounts)
    .map(([ip, data]) => ({ ip, count: data.count, country: data.country }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const anomalyRate = events.length > 0 ? (anomaliesDetected / events.length) * 100 : 0;

  return {
    allAlerts,
    alertsSent: allAlerts.length,
    anomaliesDetected,
    highSeverityAlerts,
    mediumSeverityAlerts,
    lowSeverityAlerts,
    topThreatActions,
    topSuspiciousIps,
    anomalyRate,
  };
}

// Co-pilot Actions
export async function getCopilotBriefing(customEvents?: LogEvent[]) {
  try {
    const allEvents = (customEvents && customEvents.length > 0)
      ? customEvents
      : getMockLogEvents(0);

    const summary = summarizeTelemetry(allEvents);

    const input = {
      totalEvents: allEvents.length,
      anomaliesDetected: summary.anomaliesDetected,
      alertsSent: summary.alertsSent,
      totalAlerts: summary.allAlerts.length,
      highSeverityAlerts: summary.highSeverityAlerts,
      mediumSeverityAlerts: summary.mediumSeverityAlerts,
      lowSeverityAlerts: summary.lowSeverityAlerts,
      anomalyRate: summary.anomalyRate,
      topThreatActions: summary.topThreatActions,
      topSuspiciousIps: summary.topSuspiciousIps,
      recentAlerts: summary.allAlerts.slice(0, 5).map(a => ({
        id: a.id,
        severity: a.severity,
        description: a.description,
        sourceIp: a.sourceIp,
        timestamp: a.timestamp,
      })),
      recentEvents: allEvents.slice(0, 15).map(e => ({
        action: e.action,
        status: e.status,
        anomalyScore: e.anomalyScore,
        timestamp: e.timestamp,
        sourceIp: e.sourceIp,
      })),
    };

    const briefing = await copilotBriefingFlow(input);

    return {
      success: true,
      briefing,
      metrics: {
        totalEvents: allEvents.length,
        anomaliesDetected: summary.anomaliesDetected,
        alertsSent: summary.alertsSent,
        totalAlerts: summary.allAlerts.length,
        highSeverityAlerts: summary.highSeverityAlerts,
        mediumSeverityAlerts: summary.mediumSeverityAlerts,
        lowSeverityAlerts: summary.lowSeverityAlerts,
        anomalyRate: summary.anomalyRate,
        topThreatActions: summary.topThreatActions,
        topSuspiciousIps: summary.topSuspiciousIps,
      },
    };

  } catch (error) {
    console.error("Error in getCopilotBriefing:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}


export async function askCopilotAction(
  message: string,
  customEvents?: LogEvent[],
  history?: Array<{ role: 'user' | 'model' | 'assistant'; content: string }>
) {
  try {
    const allEvents = (customEvents && customEvents.length > 0)
      ? customEvents
      : getMockLogEvents(0);

    const summary = summarizeTelemetry(allEvents);

    const telemetry = {
      totalEvents: allEvents.length,
      totalAlerts: summary.allAlerts.length,
      highSeverityAlerts: summary.highSeverityAlerts,
      mediumSeverityAlerts: summary.mediumSeverityAlerts,
      lowSeverityAlerts: summary.lowSeverityAlerts,
      topThreatActions: summary.topThreatActions,
      topSuspiciousIps: summary.topSuspiciousIps,
      recentEvents: allEvents.slice(0, 15).map(e => ({
        action: e.action,
        status: e.status,
        anomalyScore: e.anomalyScore,
        timestamp: e.timestamp,
        sourceIp: e.sourceIp,
      })),
    };

    const reply = await copilotChatFlow({
      message,
      history: history?.map(h => ({
        role: h.role === 'assistant' ? 'model' : h.role,
        content: h.content,
      })),
      telemetry,
    });

    return { success: true, reply };
  } catch (error) {
    console.error("Error in askCopilotAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate AI response",
    };
  }
}


// Playbook Actions
export async function runPlaybookAction(playbookId: string, playbookTitle: string) {
  try {
    const result = await executePlaybook({ playbookId, playbookTitle });
    
    if (result && result.decision) {
      return { success: true, message: result.decision };
    } else {
      throw new Error('AI flow did not return expected result.');
    }
  } catch (error) {
    console.error('Error running playbook via AI flow, using local simulation:', error);
    const fallbackDecisions: Record<string, string> = {
      'pb-1': 'Simulated action: Successfully added suspicious IP to cloud firewall blocklist and created Jira incident ticket (#SEC-4091).',
      'pb-2': 'Simulated action: Isolated suspicious host into quarantine security group and initiated EBS forensic snapshot.',
      'pb-3': 'Simulated action: De-escalated low-severity alert, marked as resolved, and recorded event in baseline audit log.',
      'pb-4': 'Simulated action: Created standard Jira investigation ticket (#SEC-4092) and routed to Tier-1 SOC queue.',
    };
    const message = fallbackDecisions[playbookId] || `Simulated action for "${playbookTitle}": all defined workflow actions were executed successfully.`;
    return { success: true, message };
  }
}

// Settings Actions
export async function updateThresholdAction(currentThreshold: number, newThreshold: number) {
  try {
    const sensitivityAdjustment = newThreshold - currentThreshold;

    const result = await adjustAnomalyDetectionSensitivity({
      currentThreshold,
      sensitivityAdjustment,
    });

    if (result && typeof result.adjustedThreshold === 'number') {
      revalidatePath('/dashboard/settings');
      return { success: true, newThreshold: result.adjustedThreshold };
    } else {
      throw new Error('AI flow did not return the expected result.');
    }
  } catch (error) {
    console.error('Error updating threshold:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}
