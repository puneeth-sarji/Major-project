
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
      revalidatePath('/dashboard/settings');
      revalidatePath('/dashboard');
      return { success: true, newThreshold: result.adjustedThreshold };
    } else {
      const fallback = Math.min(1.0, Math.max(0.1, Number(newThreshold.toFixed(2))));
      revalidatePath('/dashboard/settings');
      return { success: true, newThreshold: fallback };
    }
  } catch (error) {
    console.warn('adjustAnomalyDetectionSensitivity error, using direct value:', error);
    const fallback = Math.min(1.0, Math.max(0.1, Number(newThreshold.toFixed(2))));
    return { success: true, newThreshold: fallback };
  }
}
