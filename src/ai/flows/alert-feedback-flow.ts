
'use server';
/**
 * @fileOverview AI agent to handle analyst feedback on alerts and tune the detection model.
 *
 * - handleAlertFeedback - Adjusts anomaly detection threshold based on user feedback.
 * - AlertFeedbackInput - Input for the flow.
 * - AlertFeedbackOutput - Output for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AlertFeedbackInputSchema = z.object({
  feedback: z.enum(['confirm', 'dismiss']).describe("The analyst's feedback: 'confirm' for a true positive, 'dismiss' for a false positive."),
  currentThreshold: z.number().describe('The current anomaly detection threshold (0-1).'),
});
export type AlertFeedbackInput = z.infer<typeof AlertFeedbackInputSchema>;

const AlertFeedbackOutputSchema = z.object({
  newThreshold: z.number().describe('The newly adjusted anomaly detection threshold (0-1).'),
});
export type AlertFeedbackOutput = z.infer<typeof AlertFeedbackOutputSchema>;

export async function handleAlertFeedback(input: AlertFeedbackInput): Promise<AlertFeedbackOutput> {
  return alertFeedbackFlow(input);
}

const alertFeedbackFlow = ai.defineFlow(
  {
    name: 'alertFeedbackFlow',
    inputSchema: AlertFeedbackInputSchema,
    outputSchema: AlertFeedbackOutputSchema,
  },
  async ({ feedback, currentThreshold }) => {
    // This is a simplified tuning logic. A real-world system might use a more
    // complex algorithm, but this demonstrates the concept of a feedback loop.
    let adjustment = 0;

    if (feedback === 'confirm') {
      // If an alert is confirmed, it means the threshold was good or maybe even too high.
      // We can make it slightly more sensitive to catch similar, slightly weaker signals.
      adjustment = -0.005; // Decrease threshold slightly (more sensitive)
    } else if (feedback === 'dismiss') {
      // If an alert is a false positive, the system was too sensitive.
      // We increase the threshold to reduce noise.
      adjustment = 0.01; // Increase threshold (less sensitive)
    }

    let newThreshold = currentThreshold + adjustment;

    // Clamp the threshold to a reasonable range (e.g., 0.5 to 1.0)
    if (newThreshold < 0.5) {
      newThreshold = 0.5;
    } else if (newThreshold > 1.0) {
      newThreshold = 1.0;
    }

    // Round to 3 decimal places to avoid floating point issues
    newThreshold = parseFloat(newThreshold.toFixed(3));

    return {
      newThreshold,
    };
  }
);
