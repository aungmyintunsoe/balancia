"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type OptiChromeContextValue = {
  aiGenerating: boolean;
  setGeneratingSlot: (id: string, value: boolean) => void;
  goalNodKey: number;
  triggerGoalNod: () => void;
  taskCompleteSpinKey: number;
  triggerTaskCompleteSpin: () => void;
};

const OptiChromeContext = createContext<OptiChromeContextValue | null>(null);

export function OptiChromeProvider({ children }: { children: ReactNode }) {
  const [generatingSlots, setGeneratingSlots] = useState<Record<string, boolean>>({});
  const [goalNodKey, setGoalNodKey] = useState(0);
  const [taskCompleteSpinKey, setTaskCompleteSpinKey] = useState(0);

  const setGeneratingSlot = useCallback((id: string, value: boolean) => {
    setGeneratingSlots((prev) => {
      if (value) {
        if (prev[id] === true) return prev;
        return { ...prev, [id]: true };
      }
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const aiGenerating = useMemo(
    () => Object.values(generatingSlots).some(Boolean),
    [generatingSlots],
  );

  const triggerGoalNod = useCallback(() => {
    setGoalNodKey((k) => k + 1);
  }, []);

  const triggerTaskCompleteSpin = useCallback(() => {
    setTaskCompleteSpinKey((k) => k + 1);
  }, []);

  const value = useMemo(
    () => ({
      aiGenerating,
      setGeneratingSlot,
      goalNodKey,
      triggerGoalNod,
      taskCompleteSpinKey,
      triggerTaskCompleteSpin,
    }),
    [
      aiGenerating,
      setGeneratingSlot,
      goalNodKey,
      triggerGoalNod,
      taskCompleteSpinKey,
      triggerTaskCompleteSpin,
    ],
  );

  return (
    <OptiChromeContext.Provider value={value}>{children}</OptiChromeContext.Provider>
  );
}

export function useOptiChrome() {
  const ctx = useContext(OptiChromeContext);
  if (!ctx) {
    throw new Error("useOptiChrome must be used within OptiChromeProvider");
  }
  return ctx;
}
