import '@/app/globals.css'; 
import React from "react";
import SessionRoot from "@/components/SessionRoot";
import TopBar from "@/components/ui/TopBar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Clinician Virtual Assistant</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="h-screen flex flex-col">
        <SessionRoot>
          <TopBar />
          <main className="h-full flex flex-col">{children}</main>
        </SessionRoot>
      </body>
    </html>
  );
}