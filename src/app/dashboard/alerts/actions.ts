
'use server';

import { getThreatIntelligence } from "@/ai/flows/threat-intelligence-flow";
import { summarizeAndAdviseOnAlert } from "@/ai/flows/summarize-and-advise-flow";
import { handleAlertFeedback } from "@/ai/flows/alert-feedback-flow";
import type { Alert, LogEvent } from "@/types";
import type { Playbook } from "../playbooks/page";
import { revalidatePath } from "next/cache";
import { MOCK_ANALYSIS } from "@/lib/mock-analysis";


export async function checkThreatIntelligence(ipAddress: string) {
    try {
        const result = await getThreatIntelligence({ ipAddress });
        return result;
    } catch (error) {
        console.error('Error fetching threat intelligence:', error);
        return { isKnownThreat: false, details: 'Error fetching intelligence.' };
    }
}

export async function getIncidentAnalysis(
    alert: Alert, 
) {
    const severityAnalyses = MOCK_ANALYSIS[alert.severity] || MOCK_ANALYSIS['High'];
    const randomAnalysis = severityAnalyses[Math.floor(Math.random() * severityAnalyses.length)];
    
    await new Promise(resolve => setTimeout(resolve, 250));

    let action = 'Suspicious Activity';
    if (alert.description.includes('SQL Injection')) {
      action = 'SQL Injection Attack';
    } else if (alert.description.includes('Privilege escalation')) {
      action = 'Privilege Escalation Attempt';
    } else if (alert.description.includes('Data Exfiltration')) {
      action = 'Unauthorized Data Exfiltration';
    } else if (alert.description.includes('disable security logging')) {
      action = 'Security Logging Tampering';
    } else {
      const match = alert.description.match(/(?:detected:\s*|for\s*)([A-Za-z0-9_]+)/i);
      if (match) action = match[1];
    }

    return { 
        success: true, 
        analysis: { 
            incidentSummary: randomAnalysis
                .replaceAll('{{sourceIp}}', alert.sourceIp)
                .replaceAll('{{action}}', action)
        } 
    };
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
      revalidatePath('/settings');
      return { success: true, newThreshold: result.newThreshold };
    } else {
      throw new Error('AI flow did not return the expected result.');
    }
  } catch (error) {
    console.error('Error handling alert feedback:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}
