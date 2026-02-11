import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const apiKey = process.env.GOOGLE_API_KEY || '';

// Initialize GenKit with Google AI (only if API key is available)
export const ai = genkit({
  plugins: apiKey && apiKey !== 'your_google_api_key_here' ? [
    googleAI({
      apiKey,
    }),
  ] : [],
  model: 'googleai/gemini-1.5-flash',
});
