
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { addMockLogEvent } from '@/lib/mock-data';
import DarkVeil from '@/components/DarkVeil';

// Helper to detect SQL Injection patterns across login inputs
function isSqlInjectionPayload(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();

  const classicPatterns = [
    /^'?\s*or\s+['"]?1['"]?\s*=\s*['"]?1/i,                 // ' OR 1=1, OR 1=1, ' OR '1'='1
    /^'?\s*or\s+true\b/i,                                      // ' OR TRUE
    /^'?\s*or\s+['"][^'"]*['"]\s*=\s*['"][^'"]*['"]/i,       // ' OR 'a'='a'
    /^[^\s'"]+'?\s*(--|#|\/\*)/,                              // admin' --, user' #, admin@cloudsentinel.io' --
    /^'?\s*union\s+(all\s+)?select/i,                          // ' UNION SELECT
    /(\bOR\b|\bAND\b)\s+['"]?\w+['"]?\s*=\s*['"]?\w+/i,       // OR '1'='1'
    /'\s*;\s*--/i,                                             // '; --
  ];

  if (classicPatterns.some((pattern) => pattern.test(trimmed))) {
    return true;
  }

  // Also catch payload variants with arbitrary spacing/comments
  const cleaned = trimmed.replace(/[\s;'"-]+/g, ' ').trim().toLowerCase();
  if (cleaned.startsWith('or 1=1') || cleaned === 'or 1=1') {
    return true;
  }

  return false;
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Detect SQL Injection in password OR email field
    if (isSqlInjectionPayload(password) || isSqlInjectionPayload(email)) {
        addMockLogEvent({
            action: 'AUTH_LOGIN_SQL_INJECTION',
            status: 'Success',
            anomalyScore: 1.0,
        });
        localStorage.setItem('userRole', 'admin');
        toast({
          title: '🚨 SQL Injection Detected & Compromised',
          description: 'Authentication bypassed via SQL injection. High-severity alert generated in SOC stream.',
        });
        router.push('/dashboard');
        return;
    }

    if (email === 'admin@cloudsentinel.io' && password === 'password') {
      localStorage.setItem('userRole', 'admin');
      toast({ title: 'Login Successful', description: 'Welcome, Admin!' });
      router.push('/dashboard');
    } else if (email === 'user@cloudsentinel.io' && password === 'password') {
      localStorage.setItem('userRole', 'user');
      toast({ title: 'Login Successful', description: 'Welcome, User!' });
      router.push('/user-activity');
    } else {
      toast({ variant: 'destructive', title: 'Login Failed', description: 'Invalid email or password.' });
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
        <div className="absolute inset-0 -z-10">
          <DarkVeil />
        </div>
        <div className="flex flex-col items-center gap-4 text-center">
             <Logo />
             <h1 className="text-3xl font-bold">Cloud Threat Detection System</h1>
             <p className="max-w-md text-muted-foreground">
                Enter your credentials to access the security dashboard. Use <code className='font-mono bg-muted p-1 rounded-md text-xs'>admin@cloudsentinel.io</code> or <code className='font-mono bg-muted p-1 rounded-md text-xs'>user@cloudsentinel.io</code> with password <code className='font-mono bg-muted p-1 rounded-md text-xs'>password</code>.
            </p>
             <p className="max-w-md text-sm text-muted-foreground">
                To test SQL Injection detection, enter <code className='font-mono bg-muted p-1 rounded-md text-xs'>&apos; OR 1=1; --</code> in either the email or password field.
            </p>
        </div>
        <Card className="mt-8 w-full max-w-sm bg-background/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Use your assigned credentials to sign in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                        id="email" 
                        type="email" 
                        placeholder="admin@cloudsentinel.io" 
                        value={email}
                        onChange={e => setEmail(e.target.value)} 
                        onKeyUp={e => e.key === 'Enter' && handleLogin()}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                        id="password" 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyUp={e => e.key === 'Enter' && handleLogin()}
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleLogin}>
                    Sign In
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
