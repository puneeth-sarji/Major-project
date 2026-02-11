
'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface TimeAgoProps {
  date: string | Date;
}

export function TimeAgo({ date }: TimeAgoProps) {
  const [timeAgo, setTimeAgo] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const update = () => {
        setTimeAgo(formatDistanceToNow(new Date(date), { addSuffix: true }));
      }
      update();
      // Update every 30 seconds
      const interval = setInterval(update, 30000);
      return () => clearInterval(interval);
    }
  }, [date, isMounted]);

  if (!isMounted) {
    // Render a placeholder on the server and during initial client render
    return <span className="text-sm text-muted-foreground">...</span>;
  }

  const fullDate = new Date(date).toLocaleString();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-sm text-muted-foreground cursor-help">{timeAgo}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{fullDate}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
