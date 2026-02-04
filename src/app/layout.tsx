import '@/app/globals.css';
import React from "react";
import { Poppins } from 'next/font/google';
import SessionRoot from "@/components/SessionRoot";
import TopBar from "@/components/ui/TopBar";
import { cookies } from 'next/headers';
import { resources } from '@/locales/config';

const poppins = Poppins({ subsets: ['latin'], weight: ['300','400','500','600','700'], display: 'swap' });

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'en') as keyof typeof resources;
  const theme = cookieStore.get('theme')?.value || 'default';
  const dark = cookieStore.get('dark')?.value === 'true';

  const titleText = (resources[lang] || resources.en)["app.title"]; 

  const htmlAttrs: Record<string, string> = { lang } as any;
  if (theme && theme !== 'default') htmlAttrs['data-theme'] = theme;
  const htmlClass = dark ? 'dark' : undefined;

  return (
    <html {...htmlAttrs} className={[htmlClass, poppins.className].filter(Boolean).join(' ')}>
      <head>
        <title>{titleText}</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { var m = document.cookie.match(/(?:^|; )dark=([^;]+)/); var d = m ? decodeURIComponent(m[1]) === 'true' : false; var t = (document.cookie.match(/(?:^|; )theme=([^;]+)/) || [])[1]; if (d) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); if (t && decodeURIComponent(t) !== 'default') document.documentElement.setAttribute('data-theme', decodeURIComponent(t)); } catch (e) {} })();`,
          }}
        />
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