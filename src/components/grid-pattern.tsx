'use client';
import { useId } from 'react';
import { useTheme } from 'next-themes';

export function GridPattern() {
  const patternId = useId();
  const { theme } = useTheme();

  const primary = theme === 'dark' ? 'hsla(217, 91%, 60%, 0.2)' : 'hsla(217, 91%, 60%, 0.3)';
  
  return (
    <div className="absolute inset-0 -z-10 h-full w-full bg-background">
        <svg className="absolute h-full w-full">
            <defs>
            <pattern
                id={patternId}
                width="64"
                height="64"
                patternUnits="userSpaceOnUse"
                className="animate-grid"
            >
                <path d="M64 0H0V64" fill="none" stroke={primary} strokeWidth="1"></path>
            </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`}></rect>
        </svg>
    </div>
  );
}
