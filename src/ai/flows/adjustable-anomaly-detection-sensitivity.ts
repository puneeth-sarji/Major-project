// src/ai/flows/adjustable-anomaly-detection-sensitivity.ts
'use server';

/**
 * @fileOverview Anomaly detection threshold adjustment AI agent.
 *
 * - adjustAnomalyDetectionSensitivity - A function that handles the anomaly detection threshold adjustment process.
 * - AdjustAnomalyDetectionSensitivityInput - The input type for the adjustAnomalyDetectionSensitivity function.
 * - AdjustAnomalyDetectionSensitivityOutput - The return type for the adjustAnomalyDetectionSensitivity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustAnomalyDetectionSensitivityInputSchema = z.object({
  currentThreshold: z.number().describe('The current anomaly detection threshold (0..1).'),
  sensitivityAdjustment: z.number().describe('The amount to adjust the threshold by.  Positive values increase the threshold, negative values decrease it.'),
});
export type AdjustAnomalyDetectionSensitivityInput = z.infer<typeof AdjustAnomalyDetectionSensitivityInputSchema>;

const AdjustAnomalyDetectionSensitivityOutputSchema = z.object({
  adjustedThreshold: z.number().describe('The adjusted anomaly detection threshold (0..1).'),
});
export type AdjustAnomalyDetectionSensitivityOutput = z.infer<typeof AdjustAnomalyDetectionSensitivityOutputSchema>;

export async function adjustAnomalyDetectionSensitivity(input: AdjustAnomalyDetectionSensitivityInput): Promise<AdjustAnomalyDetectionSensitivityOutput> {
  return adjustAnomalyDetectionSensitivityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adjustAnomalyDetectionSensitivityPrompt',
  input: {schema: AdjustAnomalyDetectionSensitivityInputSchema},
  output: {schema: AdjustAnomalyDetectionSensitivityOutputSchema},
  prompt: `You are an expert security analyst that helps to adjust the anomaly detection threshold for a cloud threat detection system.

  Given the current threshold of {{currentThreshold}} and a sensitivity adjustment of {{sensitivityAdjustment}}, determine the new threshold.
  The adjusted threshold should be the current threshold plus the sensitivity adjustment.
  Ensure that the adjusted threshold is between 0 and 1 (inclusive). If the adjusted threshold is less than 0, return 0. If it is greater than 1, return 1.
  `,
});

const adjustAnomalyDetectionSensitivityFlow = ai.defineFlow(
  {
    name: 'adjustAnomalyDetectionSensitivityFlow',
    inputSchema: AdjustAnomalyDetectionSensitivityInputSchema,
    outputSchema: AdjustAnomalyDetectionSensitivityOutputSchema,
  },
  async input => {
    const {currentThreshold, sensitivityAdjustment} = input;
    let adjustedThreshold = currentThreshold + sensitivityAdjustment;

    if (adjustedThreshold < 0) {
      adjustedThreshold = 0;
    } else if (adjustedThreshold > 1) {
      adjustedThreshold = 1;
    }

    const {output} = await prompt({
      ...input,
      adjustedThreshold,
    });
    return {
      adjustedThreshold: output!.adjustedThreshold,
    };
  }
);
