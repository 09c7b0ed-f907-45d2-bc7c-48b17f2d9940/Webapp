import '@/app/globals.css'; 
import React from "react";
import SessionRoot from "./SessionRoot";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <title>Clinician Virtual Assistant</title>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body>
                <SessionRoot>
                    {children}
                </SessionRoot>
            </body>
        </html>
    );
}