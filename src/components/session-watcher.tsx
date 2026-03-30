"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";

export default function SessionWatcher() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated" || session?.error === "RefreshAccessTokenError") {
      signIn("keycloak", { callbackUrl: window.location.href });
    }
  }, [session?.error, status]);

  return null;
}
