
import { ShieldCheck } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <ShieldCheck className="h-7 w-7 text-primary" />
      <h1 className="text-xl font-bold tracking-tighter text-foreground">
        CloudSentinel
      </h1>
    </div>
  );
}
