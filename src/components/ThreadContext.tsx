"use client"
import { createContext, use, useContext, useState } from "react";

type ThreadContextType = {
  currentThreadId: number | null;
  setCurrentThreadId: (id: number) => void;
};

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

export const ThreadProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentThreadId, setCurrentThreadId] = useState<number | null>(null);

  return (
    <ThreadContext.Provider value={{ currentThreadId, setCurrentThreadId }}>
      {children}
    </ThreadContext.Provider>
  );
};

export const useThread = () => {
  const context = useContext(ThreadContext);
  if (!context) throw new Error("useThread must be used within ThreadProvider");
  return context;
};