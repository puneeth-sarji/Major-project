"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { subDays, startOfDay, endOfDay, format } from "date-fns"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
}

export function DateRangePicker({
  className,
  date: controlledDate,
  onDateChange,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(() => ({
    from: startOfDay(subDays(new Date(), 6)),
    to: endOfDay(new Date()),
  }));

  const date = controlledDate !== undefined ? controlledDate : internalDate;
  const setDate = (newDate: DateRange | undefined) => {
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalDate(newDate);
    }
  };

  const handlePresetSelect = (presetValue: DateRange) => {
    setDate(presetValue);
    setIsOpen(false);
  };

  const handleCalendarSelect = (newDate: DateRange | undefined) => {
    if (!newDate) {
      setDate(undefined);
      return;
    }

    if (newDate.from && newDate.to) {
      let from = startOfDay(newDate.from);
      let to = endOfDay(newDate.to);
      if (from > to) {
        const temp = from;
        from = startOfDay(newDate.to);
        to = endOfDay(temp);
      }
      setDate({ from, to });
      setIsOpen(false);
    } else if (newDate.from) {
      setDate({
        from: startOfDay(newDate.from),
        to: undefined,
      });
    } else {
      setDate(newDate);
    }
  };

  const presets = [
    {
      label: "Today",
      getValue: () => ({
        from: startOfDay(new Date()),
        to: endOfDay(new Date()),
      }),
    },
    {
      label: "Last 7 Days",
      getValue: () => ({
        from: startOfDay(subDays(new Date(), 6)),
        to: endOfDay(new Date()),
      }),
    },
    {
      label: "Last 14 Days",
      getValue: () => ({
        from: startOfDay(subDays(new Date(), 13)),
        to: endOfDay(new Date()),
      }),
    },
    {
      label: "Last 30 Days",
      getValue: () => ({
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date()),
      }),
    },
  ];

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] sm:w-[280px] justify-start text-left font-normal shadow-sm",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
            <span className="truncate">
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                "Pick a date range"
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="flex flex-row sm:flex-col p-2 gap-1 overflow-x-auto bg-muted/20">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start text-xs font-normal whitespace-nowrap h-8 px-2"
                  onClick={() => handlePresetSelect(preset.getValue())}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
