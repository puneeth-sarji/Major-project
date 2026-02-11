
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addMockLogEvent } from '@/lib/mock-data';
import { LogOut, Shield, DatabaseBackup, Rocket, Bug, UserPlus, FileDown, ShieldAlert, ShieldOff } from 'lucide-react';
import { Logo } from '@/components/logo';

type ProjectState = 'initial' | 'active';

export default function UserActivityPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [projectState, setProjectState] = useState<ProjectState>('initial');
    const [suspiciousActionsCount, setSuspiciousActionsCount] = useState(0);

    useEffect(() => {
        const role = localStorage.getItem('userRole');
        setUserRole(role);
        if (role !== 'user' && role !== 'admin') {
            toast({ variant: 'destructive', title: 'Access Denied', description: 'Please log in.' });
            router.push('/login');
        }
    }, [router, toast]);
    
    const handleAction = (params: {
        name: string;
        action: string;
        status: 'Success' | 'Failure';
        anomalyScore: number;
        threat: boolean;
    }) => {
        addMockLogEvent({
            action: params.action,
            status: params.status,
            anomalyScore: params.anomalyScore,
        });

        toast({
            title: `Action: ${params.name}`,
            description: `A log event was generated. ${params.threat ? 'This may trigger an alert on the admin dashboard.' : ''}`,
            variant: params.threat ? 'destructive' : 'default',
        });
        
        if (params.threat) {
            setSuspiciousActionsCount(prev => prev + 1);
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        router.push('/login');
    }
    
    const startProject = () => {
         handleAction({ name: 'Create Project Repo', action: 'REPO_CREATE', status: 'Success', anomalyScore: 0.1, threat: false });
         setProjectState('active');
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
             <div className="absolute top-4 right-4 flex items-center gap-4">
                {userRole === 'admin' && (
                    <Button variant="outline" onClick={() => router.push('/dashboard')}><Shield className="mr-2 h-4 w-4" />Admin Dashboard</Button>
                )}
                <Button variant="ghost" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Logout</Button>
            </div>
            <Card className="w-full max-w-4xl animate-in">
                <CardHeader className='items-center text-center'>
                    <Logo />
                    <CardTitle className="mt-4 text-2xl">Project Apollo Console</CardTitle>
                    <CardDescription>
                       Simulate a developer workflow by performing various actions below. Your activity is being monitored.
                    </CardDescription>
                </CardHeader>
                <CardContent className="mt-4 space-y-4">
                   {projectState === 'initial' ? (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <p>No active project found.</p>
                            <Button onClick={startProject} size="lg">Create New Project</Button>
                        </div>
                   ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Deployment Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Deployment</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-2">
                                     <Button variant="outline" onClick={() => handleAction({ name: 'Deploy to Staging', action: 'DEPLOY_STAGING', status: 'Success', anomalyScore: 0.3, threat: false })}><Rocket /> Deploy to Staging</Button>
                                     <Button variant="outline" onClick={() => handleAction({ name: 'Run Integration Tests', action: 'CI_TESTS', status: 'Success', anomalyScore: 0.2, threat: false })}><Bug /> Run Integration Tests</Button>
                                </CardContent>
                            </Card>
                            {/* Data Management Card */}
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Data Management</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-2">
                                     <Button variant="outline" onClick={() => handleAction({ name: 'Backup Database', action: 'DB_BACKUP', status: 'Success', anomalyScore: 0.4, threat: false })}><DatabaseBackup /> Backup Database</Button>
                                     <Button variant="secondary" onClick={() => handleAction({ name: 'Export User Email List', action: 'DATA_EXPORT_USER_LIST', status: 'Success', anomalyScore: 0.85, threat: true })}><FileDown /> Export User Email List</Button>
                                </CardContent>
                            </Card>
                            {/* Security Card */}
                             <Card className="border-destructive/50">
                                <CardHeader>
                                    <CardTitle className="text-base text-destructive">Security & Access</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-2">
                                     <Button variant="outline" onClick={() => handleAction({ name: 'Add new user', action: 'USER_ADD', status: 'Success', anomalyScore: 0.5, threat: false })}><UserPlus /> Add New User</Button>
                                     <Button variant="destructive" onClick={() => handleAction({ name: 'Escalate My Privileges', action: 'PRIV_ESCALATION', status: 'Failure', anomalyScore: 0.95, threat: true })}><ShieldAlert /> Escalate Privileges</Button>
                                     <Button variant="destructive" onClick={() => handleAction({ name: 'Disable Security Logging', action: 'SECURITY_LOG_DISABLED', status: 'Failure', anomalyScore: 0.99, threat: true })}><ShieldOff /> Disable Logging</Button>
                                </CardContent>
                            </Card>
                        </div>
                   )}
                </CardContent>
                 {projectState === 'active' && (
                    <CardFooter className="flex-col gap-4 border-t pt-6">
                        <p className='text-sm text-center text-muted-foreground'>You have performed <span className="font-bold text-destructive">{suspiciousActionsCount}</span> suspicious action(s).</p>
                         <Button variant="ghost" onClick={() => setProjectState('initial')}>
                            Finish and Archive Project
                         </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
