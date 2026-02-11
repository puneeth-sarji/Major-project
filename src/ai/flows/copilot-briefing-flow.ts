'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CopilotBriefingInputSchema = z.object({
  recentEvents: z.array(z.object({
      action: z.string(),
      status: z.string(),
      anomalyScore: z.number(),
      timestamp: z.string(),
  })).describe('A list of the most recent log events.'),
  highSeverityAlerts: z.number().describe('The count of high-severity alerts in the last 24 hours.'),
  totalAlerts: z.number().describe('The total number of alerts in the last 24 hours.'),
});
export type CopilotBriefingInput = z.infer<typeof CopilotBriefingInputSchema>;

export const copilotBriefingFlow = ai.defineFlow(
  {
    name: 'copilotBriefingFlow',
    inputSchema: CopilotBriefingInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      console.log('Starting copilot briefing generation...');
      const { text } = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: `You are CloudSentinel, an AI security co-pilot. Your role is to provide a live, narrative-style security briefing to a security analyst.
        Analyze the provided data and generate a concise, data-driven summary of the current security posture.
        Speak in a professional, slightly formal tone. Address the analyst directly. Start with a greeting.
        Your response must be a single block of text and use Markdown for formatting.

        **Current Situation Data:**
        - **Total Alerts (24h):** ${input.totalAlerts}
        - **High-Severity Alerts (24h):** ${input.highSeverityAlerts}
        - **Recent Events Log:**
        ${input.recentEvents.map(e => `  - Action: ${e.action}, Status: ${e.status}, Score: ${e.anomalyScore.toFixed(2)}`).join('\n')}

        **Your Task:**
        1.  Start with a professional greeting (e.g., "Good morning, Analyst. I am CloudSentinel...").
        2.  Provide a summary of the overall alert situation, **integrating the specific numbers** for total and high-severity alerts directly into your sentences. For example: "There are **${input.totalAlerts} total alerts**, with **${input.highSeverityAlerts} of them being high-severity**..."
        3.  Analyze the **Recent Events Log** to identify the **most crucial event types**. Mention these specific actions by name and count if possible (e.g., "...a pattern of \`PRIV_ESCALATION\` attempts..."). This is the most important part of your analysis.
        4.  Conclude with a clear, actionable recommendation that is directly based on the numbers and patterns you identified.

        Begin your response now.`,
      });
      
      if (!text) {
        throw new Error('No response generated from AI');
      }
      console.log('Successfully generated briefing');
      return text;
    } catch (error) {
      console.error('Error in copilot briefing flow:', error);
      let errorMessage = 'An unexpected error occurred while generating your briefing.';
      
      if (error instanceof Error) {
        if (error.message.includes('NOT_FOUND')) {
          errorMessage = 'Unable to connect to the AI model. Please check your API configuration.';
        } else if (error.message.includes('INVALID_ARGUMENT')) {
          errorMessage = 'Invalid request to the AI model. Please try again.';
        } else if (error.message.includes('PERMISSION_DENIED')) {
          errorMessage = 'API key validation failed. Please check your API key configuration.';
        } else if (error.message.includes('RESOURCE_EXHAUSTED')) {
          errorMessage = 'The AI model has reached its usage limit. Please try again later.';
        }
      }
      
      throw new Error(errorMessage);
    }
  }
);
