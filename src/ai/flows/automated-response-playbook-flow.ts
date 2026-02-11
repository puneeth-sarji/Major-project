'use server';
/**
 * @fileOverview Automated Response Playbook AI agent.
 *
 * - executePlaybook - A function that decides on an automated action based on a playbook.
 * - ExecutePlaybookInput - The input type for the executePlaybook function.
 * - ExecutePlaybookOutput - The return type for the executePlaybook function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExecutePlaybookInputSchema = z.object({
  playbookId: z.string().describe('The ID of the playbook to execute.'),
  playbookTitle: z.string().describe('The title of the playbook.'),
});
export type ExecutePlaybookInput = z.infer<typeof ExecutePlaybookInputSchema>;

const ExecutePlaybookOutputSchema = z.object({
  decision: z.string().describe('A description of the action that would be taken for this test run.'),
});
export type ExecutePlaybookOutput = z.infer<typeof ExecutePlaybookOutputSchema>;

export async function executePlaybook(input: ExecutePlaybookInput): Promise<ExecutePlaybookOutput> {
  return executePlaybookFlow(input);
}

const prompt = ai.definePrompt({
  name: 'executePlaybookPrompt',
  input: { schema: ExecutePlaybookInputSchema },
  output: { schema: ExecutePlaybookOutputSchema },
  prompt: `You are a security automation engine. Given a playbook, you need to describe the action you would take for a test run.
  
  Playbook to test: "{{playbookTitle}}" (ID: {{playbookId}})
  
  Based on the playbook title, formulate a short, affirmative sentence describing the simulated action.
  
  Examples:
  - If the title is "Block Known Malicious IP", respond: "Simulated blocking of a known malicious IP address and ticket creation."
  - If the title is "Isolate Suspicious Instance", respond: "Simulated instance quarantine and snapshot creation."
  - If the title is "De-escalate Low-Severity Alerts", respond: "Simulated de-escalation of a low-severity alert."
  
  Now, for the given playbook, provide the decision.`,
});

const executePlaybookFlow = ai.defineFlow(
  {
    name: 'executePlaybookFlow',
    inputSchema: ExecutePlaybookInputSchema,
    outputSchema: ExecutePlaybookOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
