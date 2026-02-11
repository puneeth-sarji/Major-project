
'use server';
/**
 * @fileOverview Threat intelligence AI agent.
 *
 * - getThreatIntelligence - A function that fetches threat intelligence for an IP address.
 * - ThreatIntelligenceInput - The input type for the getThreatIntelligence function.
 * - ThreatIntelligenceOutput - The return type for the getThreatIntelligence function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ThreatIntelligenceInputSchema = z.object({
  ipAddress: z.string().describe('The IP address to check.'),
});
export type ThreatIntelligenceInput = z.infer<typeof ThreatIntelligenceInputSchema>;

const ThreatIntelligenceOutputSchema = z.object({
  isKnownThreat: z.boolean().describe('Whether the IP address is a known threat.'),
  details: z.string().describe('Details about the threat, or "No threat information found." if none.'),
});
export type ThreatIntelligenceOutput = z.infer<typeof ThreatIntelligenceOutputSchema>;

export async function getThreatIntelligence(input: ThreatIntelligenceInput): Promise<ThreatIntelligenceOutput> {
  return threatIntelligenceFlow(input);
}

const fetchThreatIntel = ai.defineTool({
  name: 'fetchThreatIntel',
  description: 'Fetches threat intelligence for a given IP address from a simulated threat feed.',
  inputSchema: ThreatIntelligenceInputSchema,
  outputSchema: ThreatIntelligenceOutputSchema,
},
async ({ ipAddress }) => {
  // In a real-world scenario, this would call an external API like AbuseIPDB, VirusTotal, etc.
  // For this demo, we'll simulate a response.
  
  // Simulate some IPs being known threats
  const knownThreats = {
    '189.45.23.12': 'This IP is part of a known botnet (Mirai).',
    '103.27.10.88': 'This IP is associated with spam and phishing activities.',
    '45.12.110.231': 'This IP has been reported for brute-force attacks.',
  };
  
  const isKnownThreat = ipAddress in knownThreats;
  
  if (isKnownThreat) {
    return {
      isKnownThreat: true,
      details: knownThreats[ipAddress as keyof typeof knownThreats],
    };
  }
  
  // Simulate some IPs being suspicious but not confirmed
  if (ipAddress.startsWith('8.')) {
     return {
      isKnownThreat: false,
      details: 'This IP belongs to a hosting provider, sometimes used for malicious activities. Monitor closely.',
    };
  }

  return {
    isKnownThreat: false,
    details: 'No threat information found for this IP.',
  };
});

const threatIntelligenceFlow = ai.defineFlow(
  {
    name: 'threatIntelligenceFlow',
    inputSchema: ThreatIntelligenceInputSchema,
    outputSchema: ThreatIntelligenceOutputSchema,
  },
  async input => {
    const { output } = await fetchThreatIntel(input);
    return output!;
  }
);
