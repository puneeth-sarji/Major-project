'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCopilotBriefing } from '../actions';
import dynamic from 'next/dynamic';

const Prism = dynamic(() => import('@/components/Prism'), {
  ssr: false, // Ensure this component is only rendered on the client side
});

export default function CopilotPage() {
  const [briefing, setBriefing] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // CRITICAL: Ensure component is mounted before rendering Prism
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStartBriefing = async () => {
    setIsLoading(true);
    setBriefing('');
    try {
      const result = await getCopilotBriefing();
      setBriefing(result.success ? result.briefing! : `Sorry, I was unable to generate a briefing: ${result.error}`);
    } catch (error) {
      console.error("Error during briefing generation:", error);
      setBriefing('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Outer container: Must be relative and take up full height
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Background Layer: absolute, fills parent, low z-index */}
      {mounted && (
        <div className="absolute inset-0 z-0"> {/* Changed -z-10 to z-0 for clarity, ensures it's behind content */}
          <Prism
            animationType="rotate"
            timeScale={0.5}
            height={3.5}
            baseWidth={5.5}
            scale={3.6}
            hueShift={0}
            colorFrequency={1}
            noise={0.5}
            glow={1}
          />
        </div>
      )}

      {/* Foreground Content Layer: relative, higher z-index, takes full height */}
      <div className="relative z-10 flex flex-col min-h-screen gap-4 px-6 py-0 pt-0 pb-6 animate-in"> {/* Added z-10 and min-h-screen */}
        <div className="grid gap-1 rounded-lg bg-background/80 p-2 backdrop-blur-sm w-fit -mt-2">
          <h1 className="text-3xl font-bold tracking-tight">AI Co-pilot</h1>
          <p className="text-muted-foreground">Get a live security briefing from your AI partner.</p>
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleStartBriefing}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <BrainCircuit className="mr-2 h-5 w-5" />
            )}
            {isLoading ? 'Generating Briefing...' : 'Start Live Briefing'}
          </Button>
        </div>

        {briefing && !isLoading && (
          <Card className="bg-background/80 backdrop-blur-sm"> {/* Added backdrop-blur-sm for readability */}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <span>Security Briefing</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <ReactMarkdown>{briefing}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}