"use client";

import { format, setHours, setMinutes } from "date-fns";
import { CalendarIcon, ClockIcon, XIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface DateTimeInputProps {
  value?: Date | string | null;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
}

export function DateTimeInput({
  value,
  onChange,
  placeholder = "Pick date & time",
  className,
  disabled,
  clearable = true,
}: DateTimeInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const dateValue = React.useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }, [value]);

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

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange?.(undefined);
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
    onChange?.(newDate);
  };

  const handleTimeSelect = (type: "hour" | "minute", val: string) => {
    const baseDate = dateValue || new Date();
    let newDate = baseDate;

    if (type === "hour") {
      newDate = setHours(baseDate, parseInt(val, 10));
    } else {
      newDate = setMinutes(baseDate, parseInt(val, 10));
    }

    onChange?.(newDate);
  };

  return (
    <div className={cn("relative flex w-full items-center", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-7 w-full justify-start text-left font-normal",
              !dateValue && "text-muted-foreground",
              className,
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
            onChange?.(undefined);
          }}
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Clear</span>
        </Button>
      )}
    </div>
  );
}
