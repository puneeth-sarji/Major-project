
'use server';

import { getThreatIntelligence } from "@/ai/flows/threat-intelligence-flow";
import { handleAlertFeedback } from "@/ai/flows/alert-feedback-flow";
import type { Alert } from "@/types";
import { revalidatePath } from "next/cache";
import { summarizeAndAdviseOnAlert } from "@/ai/flows/summarize-and-advise-flow";
import { getMockLogEvents } from "@/lib/mock-data";
import { initialPlaybooks } from "./playbooks/page";
import { copilotBriefingFlow } from '@/ai/flows/copilot-briefing-flow';
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

// Co-pilot Actions
export async function getCopilotBriefing() {
  try {
    const allEvents = getMockLogEvents(20);
    const allAlerts = getMockAlerts(allEvents);

    const highSeverityAlerts = allAlerts.filter(a => a.severity === 'High').length;
    
    const input = {
      recentEvents: allEvents.map(e => ({
        action: e.action,
        status: e.status,
        anomalyScore: e.anomalyScore,
        timestamp: e.timestamp,
      })),
      highSeverityAlerts,
      totalAlerts: allAlerts.length,
    };

    const briefing = await copilotBriefingFlow(input);

    return { success: true, briefing };

  } catch (error) {
    console.error("Error in getCopilotBriefing:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

// Playbook Actions
export async function runPlaybookAction(playbookId: string, playbookTitle: string) {
  try {
    const result = await executePlaybook({ playbookId, playbookTitle });
    
    if (result && result.decision) {
      return { success: true, message: result.decision };
    } else {
      throw new Error('AI flow did not return the expected result.');
    }
  } catch (error) {
    console.error('Error running playbook:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
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
