"use client";
import React from "react";
import { useThread } from "@/components/ThreadContext";

export function ThreadName() {
    const { currentThreadId } = useThread();
    
    async function GetCurrentThreadName() {
        if (!currentThreadId) return "No Thread Selected";
        try {
        const res = await fetch(`/api/threads`);
            if (!res.ok) throw new Error("Failed to fetch thread name");
            const data = await res.json();
            const thread = (data.results || []).find((t: any) => t.id === currentThreadId);
            return thread?.name || "Unnamed Thread";
        } catch (e) {
            console.error("Error fetching thread name:", e);
            return "Error Loading Thread Name";
        }
    }
    
    const [name, setName] = React.useState("Loading...");
  React.useEffect(() => {
    GetCurrentThreadName().then(setName);
  }, [currentThreadId]);

  return (
    <span className="font-bold text-white truncate min-w-0">{name}</span>
  );
}