'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BellRing, Shield, AlertTriangle, Info } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Dynamically import PixelBlast to ensure it's client-side rendered
const PixelBlast = dynamic(() => import('@/components/PixelBlast'), {
  ssr: false, // Ensure this component is only rendered on the client side
});

export default function AlertsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // You can fetch and display alert data here
  const alerts = [
    {
      id: 1,
      message: 'High severity vulnerability detected in module A.',
      type: 'critical',
      description: 'A critical vulnerability (CVE-2023-1234) was found in the authentication module. Immediate action required.',
      recordedTime: '2023-10-26 10:30 AM',
      ipAddress: '192.168.1.100',
      aiAnalysis: 'AI suggests this vulnerability could lead to unauthorized access. Recommend patching immediately and reviewing access logs.'
    },
    {
      id: 2,
      message: 'Unusual login activity from new IP address.',
      type: 'warning',
      description: 'Multiple failed login attempts from a new IP address (172.21.5.8) for user \'johndoe\'.',
      recordedTime: '2023-10-26 09:15 AM',
      ipAddress: '172.21.5.8',
      aiAnalysis: 'AI flags this as a potential brute-force attack or compromised credentials. Recommend enforcing MFA and blocking the IP address.'
    },
    {
      id: 3,
      message: 'Low disk space warning on server X.',
      type: 'info',
      description: 'Server \'web-prod-01\' is running low on disk space on the /var partition. Current usage: 95%.',
      recordedTime: '2023-10-26 08:00 AM',
      ipAddress: '10.0.0.50',
      aiAnalysis: 'AI recommends checking for large log files or unnecessary data. Consider increasing disk capacity or implementing log rotation.'
    },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <Shield className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      default:
        return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  const getAIRecommendations = (alert: any) => {
    switch (alert.type) {
      case 'critical':
        return [
          'Immediate system patching required',
          'Review access logs for unauthorized activity',
          'Implement additional security controls'
        ];
      case 'warning':
        return [
          'Monitor for continued suspicious activity',
          'Review and update access policies',
          'Consider implementing additional authentication measures'
        ];
      default:
        return [
          'Regular system maintenance recommended',
          'Update documentation and procedures',
          'Schedule follow-up review'
        ];
    }
  };

  return (
    <div className="relative w-full min-h-screen">
      {/* Background Layer */}
      {mounted && (
        <div className="fixed inset-0" style={{ zIndex: 0 }}>
          <PixelBlast
            variant="circle"
            pixelSize={6}
            color="#B19EEF"
            patternScale={3}
            patternDensity={1.2}
            pixelSizeJitter={0.5}
            enableRipples
            rippleSpeed={0.4}
            rippleThickness={0.12}
            rippleIntensityScale={1.5}
            liquid
            liquidStrength={0.12}
            liquidRadius={1.2}
            liquidWobbleSpeed={5}
            speed={0.6}
            edgeFade={0.25}
            transparent
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col min-h-screen gap-8 pt-0 pb-6 px-2 md:px-6 lg:px-8 animate-in">
        <div className="grid gap-1 rounded-lg bg-background/80 p-2 backdrop-blur-sm w-fit mt-0">
          <h1 className="text-3xl font-bold tracking-tight leading-tight m-0">Security Alerts</h1>
          <p className="text-muted-foreground m-0">Monitor and manage your security alerts.</p>
        </div>

        {alerts.length > 0 ? (
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className="bg-background/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getAlertIcon(alert.type)}
                    <span>{alert.type.toUpperCase()} Alert</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full">
                    <div className="flex flex-col gap-1">
                      <p className="text-lg font-semibold">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">Description: {alert.description}</p>
                      <p className="text-xs text-muted-foreground">Recorded: {alert.recordedTime} | IP: {alert.ipAddress}</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="mt-2 md:mt-0">
                          AI Analysis
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {getAlertIcon(alert.type)}
                            AI Analysis for {alert.type.toUpperCase()} Alert
                          </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-medium mb-2">Alert Summary</h3>
                              <p className="text-sm text-muted-foreground">{alert.aiAnalysis}</p>
                            </div>
                            <div>
                              <h3 className="font-medium mb-2">Recommended Actions</h3>
                              <ul className="list-disc list-inside space-y-2">
                                {getAIRecommendations(alert).map((rec, index) => (
                                  <li key={index} className="text-sm text-muted-foreground">{rec}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h3 className="font-medium mb-2">Impact Analysis</h3>
                              <p className="text-sm text-muted-foreground">
                                Severity: <span className="font-medium">{alert.type.toUpperCase()}</span><br />
                                Potential Impact: {alert.type === 'critical' ? 'High risk of system compromise' : 
                                                 alert.type === 'warning' ? 'Moderate risk to system security' : 
                                                 'Low impact on system operations'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-background/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-6 w-6 text-green-500" />
                <span>No New Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>All systems are operating normally.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}