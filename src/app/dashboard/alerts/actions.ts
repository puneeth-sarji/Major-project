
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
    // This is now using mock data for speed, as requested.
    const severityAnalyses = MOCK_ANALYSIS[alert.severity];
    const randomAnalysis = severityAnalyses[Math.floor(Math.random() * severityAnalyses.length)];
    
    // Simulate a short network delay for realism
    await new Promise(resolve => setTimeout(resolve, 250));

    return { 
        success: true, 
        analysis: { 
            incidentSummary: randomAnalysis
                .replace('{{sourceIp}}', alert.sourceIp)
                .replace('{{action}}', alert.description.split(' ')[4] || 'activity') // a bit of a hack to get the action
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
