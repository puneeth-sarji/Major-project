// src/ai/flows/adjustable-anomaly-threshold.ts
'use server';

/**
 * @fileOverview Anomaly score threshold adjustment AI agent.
 *
 * - adjustAnomalyThreshold - A function that handles the anomaly score threshold adjustment process.
 * - AdjustAnomalyThresholdInput - The input type for the adjustAnomalyThreshold function.
 * - AdjustAnomalyThresholdOutput - The return type for the adjustAnomalyThreshold function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustAnomalyThresholdInputSchema = z.object({
  anomalyScore: z.number().describe('The anomaly score of the log entry.'),
  currentThreshold: z.number().describe('The current anomaly score threshold.'),
});
export type AdjustAnomalyThresholdInput = z.infer<typeof AdjustAnomalyThresholdInputSchema>;

const AdjustAnomalyThresholdOutputSchema = z.object({
  raiseAlert: z.boolean().describe('Whether to raise an alert based on the adjusted threshold.'),
});
export type AdjustAnomalyThresholdOutput = z.infer<typeof AdjustAnomalyThresholdOutputSchema>;

export async function adjustAnomalyThreshold(input: AdjustAnomalyThresholdInput): Promise<AdjustAnomalyThresholdOutput> {
  return adjustAnomalyThresholdFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adjustAnomalyThresholdPrompt',
  input: {schema: AdjustAnomalyThresholdInputSchema},
  output: {schema: AdjustAnomalyThresholdOutputSchema},
  prompt: `You are an expert security analyst that helps to determine whether an alert should be raised based on the anomaly score of a log entry and a current anomaly score threshold.

  Given the anomaly score of {{anomalyScore}} and the current threshold of {{currentThreshold}}, determine whether the score exceeds the threshold.
  If the anomaly score is less than the current threshold, then you should return false (do not raise the alert), otherwise return true.
  `,
});

const adjustAnomalyThresholdFlow = ai.defineFlow(
  {
    name: 'adjustAnomalyThresholdFlow',
    inputSchema: AdjustAnomalyThresholdInputSchema,
    outputSchema: AdjustAnomalyThresholdOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
