
'use server';

import { adjustAnomalyDetectionSensitivity } from '@/ai/flows/adjustable-anomaly-detection-sensitivity';
import { revalidatePath } from 'next/cache';

export async function updateThresholdAction(currentThreshold: number, newThreshold: number) {
  try {
    const sensitivityAdjustment = newThreshold - currentThreshold;

    const result = await adjustAnomalyDetectionSensitivity({
      currentThreshold,
      sensitivityAdjustment,
    });

    if (result && typeof result.adjustedThreshold === 'number') {
      revalidatePath('/settings');
      return { success: true, newThreshold: result.adjustedThreshold };
    } else {
      throw new Error('AI flow did not return the expected result.');
    }
  } catch (error) {
    console.error('Error updating threshold:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}
