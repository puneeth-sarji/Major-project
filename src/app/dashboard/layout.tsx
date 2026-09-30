'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, ShieldAlert, Bot, BrainCircuit, LayoutDashboard, LogOut } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { getMockAlerts, getMockLogEvents } from '@/lib/mock-data';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/alerts', label: 'Alerts', icon: ShieldAlert },
  { href: '/dashboard/copilot', label: 'AI Co-pilot', icon: BrainCircuit },
  { href: '/dashboard/playbooks', label: 'Playbooks', icon: Bot },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [alertCount, setAlertCount] = React.useState<number>(0);

  React.useEffect(() => {
    const updateCount = () => {
      const logs = getMockLogEvents(0);
      const alerts = getMockAlerts(logs);
      setAlertCount(alerts.length);
    };

    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener('cloudsentinel-update', updateCount);
    const interval = setInterval(updateCount, 3000);

    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('cloudsentinel-update', updateCount);
      clearInterval(interval);
    };
  }, []);

  React.useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You must be an admin to view this page.',
      });
      router.push('/login');
    }
  }, [router, toast]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/login');
  };

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item, index) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={(item.exact ? pathname === item.href : pathname.startsWith(item.href)) && (item.href !== '/dashboard' || pathname === '/dashboard')}
                  tooltip={{
                    children: item.label,
                  }}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="animate-in"
                >
                  <Link href={item.href} prefetch className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <item.icon />
                      <span>{item.label}</span>
                    </div>
                    {item.href === '/dashboard/alerts' && alertCount > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-destructive-foreground bg-destructive rounded-full">
                        {alertCount}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="flex-col !items-stretch !gap-0">
          <Separator className="mb-2" />
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div>
                <ThemeToggle />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://picsum.photos/100" alt="User" data-ai-hint="profile picture" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold">Admin User</span>
                  <span className="text-xs text-muted-foreground">admin@cloudsentinel.io</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip={{ children: 'Logout' }}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <main className="flex-1 overflow-y-auto p-0 m-0" style={{ paddingTop: '10px' }}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default React.memo(DashboardLayout);
