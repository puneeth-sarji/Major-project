'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { updateThresholdAction } from './actions';
import { 
  Loader2, 
  Sliders, 
  Bell, 
  Send, 
  ShieldAlert, 
  Database, 
  RotateCcw, 
  CheckCircle2, 
  Mail, 
  Slack, 
  Cloud 
} from 'lucide-react';
import dynamic from 'next/dynamic';

const LightRays = dynamic(() => import('@/components/LightRays'), {
  ssr: false,
});

export default function SettingsPage() {
  const { toast } = useToast();

  // Threshold State
  const [threshold, setThreshold] = useState(0.8);
  const [savedThreshold, setSavedThreshold] = useState(0.8);

  // Notification Channels
  const [slackWebhook, setSlackWebhook] = useState('');
  const [snsArn, setSnsArn] = useState('');
  const [alertEmail, setAlertEmail] = useState('');
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);

  // Automated Response Policy Toggles
  const [autoQuarantine, setAutoQuarantine] = useState(true);
  const [autoBlockMaliciousIP, setAutoBlockMaliciousIP] = useState(true);
  const [requireHumanApproval, setRequireHumanApproval] = useState(false);

  // Testing States
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [isThresholdPending, startThresholdTransition] = useTransition();
  const [isNotificationsPending, startNotificationsTransition] = useTransition();
  const [isPoliciesPending, startPoliciesTransition] = useTransition();

  // Load stored settings on mount
  useEffect(() => {
    try {
      const storedThreshold = localStorage.getItem('anomalyThreshold');
      if (storedThreshold) {
        const parsed = parseFloat(storedThreshold);
        if (!isNaN(parsed)) {
          setThreshold(parsed);
          setSavedThreshold(parsed);
        }
      }

      const storedSlack = localStorage.getItem('slackWebhook');
      if (storedSlack) setSlackWebhook(storedSlack);

      const storedSns = localStorage.getItem('snsArn');
      if (storedSns) setSnsArn(storedSns);

      const storedEmail = localStorage.getItem('alertEmail');
      if (storedEmail) setAlertEmail(storedEmail);

      const storedEmailToggle = localStorage.getItem('emailAlertsEnabled');
      if (storedEmailToggle !== null) setEmailAlertsEnabled(storedEmailToggle === 'true');

      const storedQuarantine = localStorage.getItem('autoQuarantine');
      if (storedQuarantine !== null) setAutoQuarantine(storedQuarantine === 'true');

      const storedAutoBlock = localStorage.getItem('autoBlockMaliciousIP');
      if (storedAutoBlock !== null) setAutoBlockMaliciousIP(storedAutoBlock === 'true');

      const storedApproval = localStorage.getItem('requireHumanApproval');
      if (storedApproval !== null) setRequireHumanApproval(storedApproval === 'true');
    } catch (err) {
      console.error('Error loading settings from localStorage:', err);
    }
  }, []);

  const handleSaveThreshold = () => {
    startThresholdTransition(async () => {
      const result = await updateThresholdAction(savedThreshold, threshold);
      if (result.success && typeof result.newThreshold === 'number') {
        const newThresh = result.newThreshold;
        setSavedThreshold(newThresh);
        setThreshold(newThresh);
        localStorage.setItem('anomalyThreshold', newThresh.toString());
        window.dispatchEvent(new Event('storage'));

        toast({
          title: "Detection Sensitivity Updated",
          description: `Anomaly alert threshold is now set to ${newThresh.toFixed(2)}.`,
        });
      } else {
        const err = ('error' in result && typeof result.error === 'string') ? result.error : 'Failed to update threshold.';
        toast({
          variant: "destructive",
          title: "Error Saving Threshold",
          description: err,
        });
        setThreshold(savedThreshold);
      }
    });
  };

  const handleSaveNotifications = () => {
    startNotificationsTransition(() => {
      localStorage.setItem('slackWebhook', slackWebhook);
      localStorage.setItem('snsArn', snsArn);
      localStorage.setItem('alertEmail', alertEmail);
      localStorage.setItem('emailAlertsEnabled', emailAlertsEnabled.toString());
      window.dispatchEvent(new Event('storage'));

      toast({
        title: "Notification Channels Saved",
        description: "Your alert dispatch channels have been saved to local storage.",
      });
    });
  };

  const handleSavePolicies = () => {
    startPoliciesTransition(() => {
      localStorage.setItem('autoQuarantine', autoQuarantine.toString());
      localStorage.setItem('autoBlockMaliciousIP', autoBlockMaliciousIP.toString());
      localStorage.setItem('requireHumanApproval', requireHumanApproval.toString());
      window.dispatchEvent(new Event('storage'));

      toast({
        title: "Automated Policies Saved",
        description: "Response policies updated successfully.",
      });
    });
  };

  const handleTestChannel = (channel: 'slack' | 'sns' | 'email') => {
    setTestingChannel(channel);
    setTimeout(() => {
      setTestingChannel(null);
      if (channel === 'slack') {
        toast({
          title: "Slack Test Sent",
          description: slackWebhook
            ? `Dispatched simulated test alert to Slack Webhook endpoint.`
            : `Simulated Slack dispatch: Webhook URL is empty, using sandbox dispatcher.`,
        });
      } else if (channel === 'sns') {
        toast({
          title: "AWS SNS Test Sent",
          description: snsArn
            ? `Dispatched simulated test message to SNS topic: ${snsArn.slice(0, 30)}...`
            : `Simulated SNS dispatch: Topic ARN is empty, using sandbox dispatcher.`,
        });
      } else {
        toast({
          title: "Email Dispatch Test Sent",
          description: alertEmail
            ? `Sent test security digest to ${alertEmail}.`
            : `Simulated email dispatch to SOC default distribution list.`,
        });
      }
    }, 600);
  };

  const handleResetLogEvents = () => {
    localStorage.removeItem('mockLogEvents');
    window.dispatchEvent(new Event('storage'));
    toast({
      title: "Logs Reset",
      description: "Demo security log events have been regenerated with fresh 30-day telemetry data.",
    });
  };

  const getSensitivityTier = (val: number) => {
    if (val < 0.70) return { label: 'High Sensitivity', variant: 'destructive' as const, desc: 'Catches subtle anomalies; increases alert volume.' };
    if (val <= 0.85) return { label: 'Balanced (Recommended)', variant: 'default' as const, desc: 'Optimal signal-to-noise ratio for standard production environments.' };
    return { label: 'Conservative', variant: 'secondary' as const, desc: 'Only high-confidence, extreme anomalies will trigger alerts.' };
  };

  const sensitivityInfo = getSensitivityTier(threshold);

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
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

      <div className="relative z-10 flex flex-col min-h-screen gap-6 p-4 md:p-8 animate-in max-w-6xl mx-auto pb-16">
        <div className="grid gap-1 rounded-lg bg-background/85 p-3 backdrop-blur-md w-fit border shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">System & Security Settings</h1>
          <p className="text-muted-foreground text-sm">
            Configure anomaly detection sensitivity, notification dispatch channels, and automated response policies.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Anomaly Detection Model */}
          <Card className="bg-background/85 backdrop-blur-md border shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sliders className="h-5 w-5 text-primary" />
                  Anomaly Detection Sensitivity
                </CardTitle>
                <Badge variant={sensitivityInfo.variant}>
                  {sensitivityInfo.label}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                Calibrate the machine learning threshold. Events scoring above this value will trigger security alerts.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-3 bg-muted/40 p-3.5 rounded-lg border">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Alert Score Threshold:</span>
                  <span className="font-mono font-bold text-lg text-primary">{threshold.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground font-medium shrink-0">0.50 (Sensitive)</span>
                  <Slider
                    id="threshold-slider"
                    min={0.5}
                    max={0.99}
                    step={0.01}
                    value={[threshold]}
                    onValueChange={(value) => setThreshold(value[0])}
                    disabled={isThresholdPending}
                    className="flex-1"
                  />
                  <span className="text-[11px] text-muted-foreground font-medium shrink-0">0.99 (Strict)</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{sensitivityInfo.desc}</p>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold">Quick Presets</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant={threshold === 0.65 ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setThreshold(0.65)}
                  >
                    High (0.65)
                  </Button>
                  <Button
                    type="button"
                    variant={threshold === 0.80 ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setThreshold(0.80)}
                  >
                    Balanced (0.80)
                  </Button>
                  <Button
                    type="button"
                    variant={threshold === 0.90 ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setThreshold(0.90)}
                  >
                    Strict (0.90)
                  </Button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t px-6 py-3 bg-muted/20 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Current active: <strong className="font-mono">{savedThreshold.toFixed(2)}</strong>
              </span>
              <Button
                size="sm"
                onClick={handleSaveThreshold}
                disabled={isThresholdPending || threshold === savedThreshold}
              >
                {isThresholdPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Detection Threshold
              </Button>
            </CardFooter>
          </Card>

          {/* Card 2: Notification Channels */}
          <Card className="bg-background/85 backdrop-blur-md border shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-primary" />
                Alert Notification Channels
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Configure endpoints for automated alert dispatching and incident escalation.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="slack-webhook" className="text-xs flex items-center gap-1.5">
                    <Slack className="h-3.5 w-3.5 text-emerald-500" />
                    Slack Incoming Webhook URL
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] px-2"
                    onClick={() => handleTestChannel('slack')}
                    disabled={testingChannel === 'slack'}
                  >
                    {testingChannel === 'slack' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                    Test
                  </Button>
                </div>
                <Input
                  id="slack-webhook"
                  placeholder="https://hooks.slack.com/services/T00/B00/XXXX"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="sns-arn" className="text-xs flex items-center gap-1.5">
                    <Cloud className="h-3.5 w-3.5 text-amber-500" />
                    AWS SNS Topic ARN
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] px-2"
                    onClick={() => handleTestChannel('sns')}
                    disabled={testingChannel === 'sns'}
                  >
                    {testingChannel === 'sns' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                    Test
                  </Button>
                </div>
                <Input
                  id="sns-arn"
                  placeholder="arn:aws:sns:us-east-1:123456789012:security-alerts"
                  value={snsArn}
                  onChange={(e) => setSnsArn(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="alert-email" className="text-xs flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-blue-500" />
                    Security Team Email Digest
                  </Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={emailAlertsEnabled}
                      onCheckedChange={setEmailAlertsEnabled}
                      aria-label="Toggle email alerts"
                    />
                  </div>
                </div>
                <Input
                  id="alert-email"
                  type="email"
                  placeholder="security-ops@company.com"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  disabled={!emailAlertsEnabled}
                  className="text-xs h-8"
                />
              </div>
            </CardContent>

            <CardFooter className="border-t px-6 py-3 bg-muted/20 flex justify-end">
              <Button
                size="sm"
                onClick={handleSaveNotifications}
                disabled={isNotificationsPending}
              >
                {isNotificationsPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Notification Channels
              </Button>
            </CardFooter>
          </Card>

          {/* Card 3: Automated Response Policy */}
          <Card className="bg-background/85 backdrop-blur-md border shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Automated Incident Response Policy
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Define automatic remediation rules executed when high-severity anomalies are confirmed.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-md bg-muted/30 border">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Auto-Quarantine Compute Instances</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically isolate EC2/GCE instances exhibiting high-anomaly score into quarantine security groups.
                  </p>
                </div>
                <Switch
                  checked={autoQuarantine}
                  onCheckedChange={setAutoQuarantine}
                />
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-md bg-muted/30 border">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Auto-Block Known Malicious IPs</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Instantly push IP drop rules to cloud firewalls for IPs flagged with high threat intelligence score.
                  </p>
                </div>
                <Switch
                  checked={autoBlockMaliciousIP}
                  onCheckedChange={setAutoBlockMaliciousIP}
                />
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-md bg-muted/30 border">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Require SOC Approval for Destructive Steps</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Prompt for manual confirmation before terminating instances or permanent key rotations.
                  </p>
                </div>
                <Switch
                  checked={requireHumanApproval}
                  onCheckedChange={setRequireHumanApproval}
                />
              </div>
            </CardContent>

            <CardFooter className="border-t px-6 py-3 bg-muted/20 flex justify-end">
              <Button
                size="sm"
                onClick={handleSavePolicies}
                disabled={isPoliciesPending}
              >
                {isPoliciesPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Response Policies
              </Button>
            </CardFooter>
          </Card>

          {/* Card 4: Data Retention & Demo Log Sandbox */}
          <Card className="bg-background/85 backdrop-blur-md border shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-primary" />
                Data Retention & Telemetry Cache
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Manage demo telemetry data, cache state, and local simulated storage.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-2 border">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="font-semibold">Local Storage Ingestion Engine Active</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Log events, alerts, and playbooks are persisted and dynamically synced in your browser session for ultra-fast local response.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Demo Sandbox Controls</Label>
                <p className="text-[11px] text-muted-foreground">
                  Reset the ingested log database to generate a fresh 30-day stream of 300 synthetic security events and correlated anomalies.
                </p>
              </div>
            </CardContent>

            <CardFooter className="border-t px-6 py-3 bg-muted/20 flex justify-between items-center">
              <span className="text-[11px] text-muted-foreground">30-day telemetry stream</span>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={handleResetLogEvents}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Demo Logs
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}