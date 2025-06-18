"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";

export default function SessionWatcher() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.accessTokenExpires) return;

    const msLeft = session.accessTokenExpires - Date.now();
    const timeout = msLeft > 30000 ? msLeft - 30000 : 0;

    const timer = setTimeout(() => {
      signIn();
    }, timeout);

    return () => clearTimeout(timer);
  }, [session, status]);

  return null;
}
