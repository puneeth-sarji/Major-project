'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { updateThresholdAction } from '../actions';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic'; // Import dynamic

// Dynamically import LightRays to ensure it's client-side rendered
const LightRays = dynamic(() => import('@/components/LightRays'), {
  ssr: false, // Ensure this component is only rendered on the client side
});

export default function SettingsPage() {
  const { toast } = useToast();
  const [threshold, setThreshold] = useState(0.8);
  const [savedThreshold, setSavedThreshold] = useState(0.8);
  const [slackWebhook, setSlackWebhook] = useState('');
  const [snsArn, setSnsArn] = useState('');

  const [isThresholdPending, startThresholdTransition] = useTransition();
  const [isNotificationsPending, startNotificationsTransition] = useTransition();

  useEffect(() => {
    const storedThreshold = localStorage.getItem('anomalyThreshold');
    if (storedThreshold) {
      const parsed = parseFloat(storedThreshold);
      setThreshold(parsed);
      setSavedThreshold(parsed);
    }
    const storedSlack = localStorage.getItem('slackWebhook');
    if (storedSlack) setSlackWebhook(storedSlack);
    const storedSns = localStorage.getItem('snsArn');
    if (storedSns) setSnsArn(storedSns);
  }, []);

  const handleSaveThreshold = () => {
    startThresholdTransition(async () => {
      const result = await updateThresholdAction(savedThreshold, threshold);
      if (result.success) {
        const newThresh = result.newThreshold;
        toast({
          title: "Settings Saved",
          description: `Anomaly detection threshold set to ${newThresh.toFixed(2)}.`,
        });
        setSavedThreshold(newThresh);
        setThreshold(newThresh);
        localStorage.setItem('anomalyThreshold', newThresh.toString());
      } else {
        toast({
          variant: "destructive",
          title: "Error Saving Threshold",
          description: result.error,
        });
        setThreshold(savedThreshold);
      }
    });
  };

  const handleSaveNotifications = () => {
    startNotificationsTransition(() => {
      // Using a timeout to demonstrate the transition state, as localStorage is synchronous
      setTimeout(() => {
        localStorage.setItem('slackWebhook', slackWebhook);
        localStorage.setItem('snsArn', snsArn);
        toast({
            title: "Notification Settings Saved",
            description: "Your notification channels have been updated.",
        });
      }, 300);
    });
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
          className="w-full h-full"
        />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen gap-8 p-6 animate-in">
        <div className="grid gap-1 rounded-lg bg-background/80 p-2 backdrop-blur-sm w-fit">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Settings</h1>
          <p className="text-muted-foreground">
            Configure system parameters and notification settings.
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="bg-background/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Anomaly Detection</CardTitle>
              <CardDescription>
                Adjust the sensitivity of the anomaly detection model. A lower threshold is more sensitive and will generate more alerts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="threshold-slider">Alert Threshold: <span className="font-bold text-primary">{threshold.toFixed(2)}</span></Label>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">More Sensitive</span>
                  <Slider
                    id="threshold-slider"
                    min={0.5}
                    max={1.0}
                    step={0.01}
                    value={[threshold]}
                    onValueChange={(value) => setThreshold(value[0])}
                    disabled={isThresholdPending}
                  />
                  <span className="text-sm text-muted-foreground">Less Sensitive</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSaveThreshold} disabled={isThresholdPending || threshold === savedThreshold}>
                {isThresholdPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="bg-background/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>
                Configure where to send alerts. Provide your Slack Webhook URL and SNS Topic ARN. Settings are saved locally to your browser.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                  <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
                  <Input 
                    id="slack-webhook" 
                    placeholder="https://hooks.slack.com/services/..." 
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    disabled={isNotificationsPending}
                  />
               </div>
               <div className="space-y-2">
                  <Label htmlFor="sns-arn">AWS SNS Topic ARN</Label>
                  <Input 
                    id="sns-arn" 
                    placeholder="arn:aws:sns:us-east-1:..." 
                    value={snsArn}
                    onChange={(e) => setSnsArn(e.target.value)}
                    disabled={isNotificationsPending}
                  />
               </div>
            </CardContent>
             <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSaveNotifications} disabled={isNotificationsPending}>
                {isNotificationsPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Notifications
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}