
'use server';
/**
 * @fileOverview AI agent for summarizing security incidents and advising on response.
 *
 * - summarizeAndAdviseOnAlert - Generates a summary and recommends actions for a security alert.
 * - SummarizeAndAdviseInput - Input for the flow.
 * - SummarizeAndAdviseOutput - Output for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeAndAdviseInputSchema = z.object({
  alert: z.object({
    severity: z.string(),
    description: z.string(),
    sourceIp: z.string(),
    timestamp: z.string(),
  }),
});
export type SummarizeAndAdviseInput = z.infer<typeof SummarizeAndAdviseInputSchema>;

const SummarizeAndAdviseOutputSchema = z.object({
  incidentSummary: z.string().describe('A concise, human-readable summary of the security incident, written in Markdown format. It should also include a list of recommended actions for the analyst.'),
});
export type SummarizeAndAdviseOutput = z.infer<typeof SummarizeAndAdviseOutputSchema>;


const summarizeAndAdvisePrompt = ai.definePrompt({
    name: 'summarizeAndAdvisePrompt',
    input: { schema: SummarizeAndAdviseInputSchema },
    output: { schema: SummarizeAndAdviseOutputSchema },
    prompt: `You are a world-class security analyst and AI assistant, named Sentinel. Your role is to analyze a security alert, summarize the incident, and recommend clear, actionable steps for a human analyst.

    **Incident Details:**
    - **Alert Time:** {{alert.timestamp}}
    - **Severity:** {{alert.severity}}
    - **Description:** {{alert.description}}
    - **Source IP:** {{alert.sourceIp}}
    
    **Your Task:**
    
    1.  **Summarize the Incident:** Based *only* on the incident details provided, write a brief, clear summary of what happened. Use Markdown for formatting (e.g., bolding, bullet points). Explain the potential risk based on the description and severity.
    
    2.  **Recommend Actions:** Provide a bulleted list of the most critical next steps for the analyst. These should be generic, best-practice recommendations based on the alert type. For example, if it is a "Privilege Escalation" attempt, recommend investigating the user account. If it is a critical alert, recommend checking system integrity. Always recommend creating a ticket for tracking.

    Combine the summary and recommended actions into a single response. Provide your response in the required JSON format.`,
});

export async function summarizeAndAdviseOnAlert(
  input: SummarizeAndAdviseInput,
): Promise<SummarizeAndAdviseOutput> {
  const { output } = await summarizeAndAdvisePrompt(input);

  if (!output) {
    throw new Error("Failed to generate incident analysis.");
  }

  return output;
}
