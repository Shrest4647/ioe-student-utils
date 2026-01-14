"use client";

import { format, setHours, setMinutes } from "date-fns";
import { CalendarIcon, ClockIcon, GlobeIcon, XIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface DateTimezoneInputProps {
  value?: {
    date: Date | string | null;
    timezone: string;
  };
  onChange?: (value: { date: Date | undefined; timezone: string }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
}

export function DateTimezoneInput({
  value,
  onChange,
  placeholder = "Pick date, time & timezone",
  className,
  disabled,
  clearable = true,
}: DateTimezoneInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const dateValue = React.useMemo(() => {
    if (!value?.date) return undefined;
    if (value.date instanceof Date) return value.date;
    const parsed = new Date(value.date);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }, [value?.date]);

  const timezoneValue =
    value?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );

  const selectedHour = dateValue
    ? dateValue.getHours().toString().padStart(2, "0")
    : "00";
  const selectedMinute = dateValue
    ? dateValue.getMinutes().toString().padStart(2, "0")
    : "00";

  // Get all unique timezones
  const timezones = React.useMemo(() => {
    try {
      return (Intl as any).supportedValuesOf("timeZone") as string[];
    } catch (_e) {
      return ["UTC", "America/New_York", "Europe/London", "Asia/Tokyo"]; // Fallback
    }
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange?.({ date: undefined, timezone: timezoneValue });
      return;
    }

    let newDate = date;
    if (dateValue) {
      newDate = setHours(newDate, dateValue.getHours());
      newDate = setMinutes(newDate, dateValue.getMinutes());
    } else {
      newDate = setHours(newDate, 0);
      newDate = setMinutes(newDate, 0);
    }
    onChange?.({ date: newDate, timezone: timezoneValue });
  };

  const handleTimeSelect = (type: "hour" | "minute", val: string) => {
    const baseDate = dateValue || new Date();
    let newDate = baseDate;

    if (type === "hour") {
      newDate = setHours(baseDate, parseInt(val, 10));
    } else {
      newDate = setMinutes(baseDate, parseInt(val, 10));
    }

    onChange?.({ date: newDate, timezone: timezoneValue });
  };

  const handleTimezoneChange = (tz: string) => {
    onChange?.({ date: dateValue, timezone: tz });
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative flex w-full items-center">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-7 w-full justify-start text-left font-normal",
                !dateValue && "text-muted-foreground",
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateValue ? (
                format(dateValue, "PPP HH:mm")
              ) : (
                <span>{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex divide-x">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={handleDateSelect}
                initialFocus
              />
              <div className="flex h-[300px] divide-x">
                <ScrollArea className="w-16">
                  <div className="flex flex-col p-2">
                    <div className="mb-2 flex items-center justify-center text-muted-foreground">
                      <ClockIcon className="h-3 w-3" />
                    </div>
                    {hours.map((h) => (
                      <Button
                        key={h}
                        variant={selectedHour === h ? "default" : "ghost"}
                        size="sm"
                        className="h-8 w-full justify-center px-0 text-xs"
                        onClick={() => handleTimeSelect("hour", h)}
                      >
                        {h}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
                <ScrollArea className="w-16">
                  <div className="flex flex-col p-2">
                    <div className="mb-2 flex items-center justify-center text-muted-foreground">
                      <span className="font-bold text-[10px]">MIN</span>
                    </div>
                    {minutes.map((m) => (
                      <Button
                        key={m}
                        variant={selectedMinute === m ? "default" : "ghost"}
                        size="sm"
                        className="h-8 w-full justify-center px-0 text-xs"
                        onClick={() => handleTimeSelect("minute", m)}
                      >
                        {m}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {clearable && dateValue && !disabled && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange?.({ date: undefined, timezone: timezoneValue });
            }}
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Clear</span>
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <GlobeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Select
          value={timezoneValue}
          onValueChange={handleTimezoneChange}
          disabled={disabled}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            className="w-[var(--radix-select-trigger-width)]"
          >
            <ScrollArea className="h-60">
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz} className="text-xs">
                  {tz}
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
