'use server';

import {
  getCopilotBriefing as getCopilotBriefingBase,
  askCopilotAction as askCopilotActionBase,
} from '@/app/dashboard/actions';
import type { LogEvent } from '@/types';

export async function getCopilotBriefing(customEvents?: LogEvent[]) {
  return getCopilotBriefingBase(customEvents);
}

export async function askCopilotAction(
  message: string,
  customEvents?: LogEvent[],
  history?: Array<{ role: 'user' | 'model' | 'assistant'; content: string }>
) {
  return askCopilotActionBase(message, customEvents, history);
}
