
'use server';

import { executePlaybook } from '@/ai/flows/automated-response-playbook-flow';

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
