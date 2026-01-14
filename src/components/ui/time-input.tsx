"use client";

import { ClockIcon, XIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface TimeInputProps {
  value?: string | null; // HH:mm format
  onChange?: (time: string | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
}

export function TimeInput({
  value,
  onChange,
  placeholder = "Pick a time",
  className,
  disabled,
  clearable = true,
}: TimeInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );

  const [selectedHour, selectedMinute] = React.useMemo(() => {
    if (!value) return ["00", "00"];
    const [h, m] = value.split(":");
    return [h || "00", m || "00"];
  }, [value]);

  const handleSelect = (type: "hour" | "minute", val: string) => {
    let newHour = selectedHour;
    let newMinute = selectedMinute;

    if (type === "hour") newHour = val;
    if (type === "minute") newMinute = val;

    onChange?.(`${newHour}:${newMinute}`);
  };

  return (
    <div className={cn("relative flex w-full items-center", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-7 w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              className,
            )}
            disabled={disabled}
          >
            <ClockIcon className="mr-2 h-4 w-4" />
            {value ? value : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex h-[300px] divide-x">
            <ScrollArea className="w-16">
              <div className="flex flex-col p-2">
                {hours.map((h) => (
                  <Button
                    key={h}
                    variant={selectedHour === h ? "default" : "ghost"}
                    size="sm"
                    className="h-8 w-full justify-center px-0"
                    onClick={() => handleSelect("hour", h)}
                  >
                    {h}
                  </Button>
                ))}
              </div>
            </ScrollArea>
            <ScrollArea className="w-16">
              <div className="flex flex-col p-2">
                {minutes.map((m) => (
                  <Button
                    key={m}
                    variant={selectedMinute === m ? "default" : "ghost"}
                    size="sm"
                    className="h-8 w-full justify-center px-0"
                    onClick={() => handleSelect("minute", m)}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
      {clearable && value && !disabled && (
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
