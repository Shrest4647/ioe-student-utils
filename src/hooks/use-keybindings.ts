"use client";
import { useEffect, useRef } from "react";

interface KeyBinding {
  cmd: string[];
  callback: () => void;
}

export const useKeybindings = (bindings: KeyBinding[]) => {
  // Keep track of the latest bindings to avoid stale closures
  const bindingsRef = useRef(bindings);

  // Update bindings ref when they change
  useEffect(() => {
    bindingsRef.current = bindings;
  }, [bindings]);

  useEffect(() => {
    const currentlyPressedKeys = new Set<string>();

    const areAllKeyPressed = (keys: string[]) => {
      for (const key of keys) {
        if (!currentlyPressedKeys.has(key)) return false;
      }
      return true;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      currentlyPressedKeys.add(e.key);

      bindingsRef.current.forEach((binding) => {
        if (areAllKeyPressed(binding.cmd)) {
          binding.callback();
        }
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      currentlyPressedKeys.delete(e.key);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
};
