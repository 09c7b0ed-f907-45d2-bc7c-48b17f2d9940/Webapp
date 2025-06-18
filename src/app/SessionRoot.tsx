"use client";
import { SessionProvider, useSession, signIn } from "next-auth/react";
import React, { useEffect } from "react";

function SessionWatcher() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session) {
      if (session.accessTokenExpires) {
        const secondsLeft = Math.floor((session.accessTokenExpires - Date.now()) / 1000);
        if (secondsLeft <= 0) {
          signIn();
        } else {
          const timer = setTimeout(() => {
            signIn();
          }, secondsLeft * 1000);
          return () => clearTimeout(timer);
        }
      }
    } else if (status === "unauthenticated") {
      signIn();
    }
  }, [session, status]);

  return null;
}

function ThemeConsoleCommands() {
  useEffect(() => {
    window.setTheme = (theme) => {
      document.documentElement.setAttribute("data-theme", theme);
    };
    window.setDark = (enabled) => {
      if (enabled) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    console.info(
      "Theme commands available:\n" +
      "setTheme('blue') // or any theme name\n" +
      "setDark(true) // enable dark mode\n" +
      "setDark(false) // disable dark mode"
    );
  }, []);
  return null;
}

export default function SessionRoot({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionWatcher />
      <ThemeConsoleCommands />
      {children}
    </SessionProvider>
  );
}

declare global {
  interface Window {
    setTheme: (theme: string) => void;
    setDark: (enabled: boolean) => void;
  }
}
