"use client";
import React, { useEffect, useState } from "react";
import { LogOutIcon, Moon, Sun } from "lucide-react"
import { signOut } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from "@/locales/config";

const themes = [
	// { key: "topbar.theme.default", value: "default" },
	{ key: "topbar.theme.resq", value: "resq" },
	// { key: "topbar.theme.green", value: "green" },
	// { key: "topbar.theme.red", value: "red" },
	// { key: "topbar.theme.magenta", value: "magenta" },
	// { key: "topbar.theme.blue", value: "blue" },
	// { key: "topbar.theme.yellow", value: "yellow" },
] as const;

const baseLanguages: { label: string; value: string }[] = SUPPORTED_LANGUAGES.map((code) => ({ label: LANGUAGE_LABELS[code], value: code }));

export default function TopBar() {
	const theme = useSettingsStore((s) => s.theme);
	const setTheme = useSettingsStore((s) => s.setTheme);
	const dark = useSettingsStore((s) => s.darkMode);
	const setDark = useSettingsStore((s) => s.setDarkMode);
	const language = useSettingsStore((s) => s.language);
	const setLanguage = useSettingsStore((s) => s.setLanguage);

	const { t } = useTranslation("common");

	const [botsByLang, setBotsByLang] = useState<Record<string, boolean>>({});
		const [botLangs, setBotLangs] = useState<string[]>([]);

	useEffect(() => {
		let cancelled = false;
			fetch('/api/rasa/bots')
			.then(r => r.ok ? r.json() : Promise.reject(r.status))
				.then((data: { bots: { lang: string }[] }) => {
				if (cancelled) return;
				const map: Record<string, boolean> = {};
					const langs: string[] = [];
					for (const b of data.bots || []) { map[b.lang] = true; langs.push(b.lang); }
				setBotsByLang(map);
					setBotLangs(langs);
			})
			.catch(() => setBotsByLang({}));
		return () => { cancelled = true };
	}, []);

	useEffect(() => {
		if (theme && theme !== "default") { 
			document.documentElement.setAttribute("data-theme", theme);
		} else {
			document.documentElement.removeAttribute("data-theme");
		}
		if (typeof document !== 'undefined') {
			document.cookie = `theme=${theme}; path=/; max-age=31536000; samesite=lax`;
		}
	}, [theme]);

	useEffect(() => {
		if (dark) document.documentElement.classList.add("dark");
		else document.documentElement.classList.remove("dark");
		if (typeof document !== 'undefined') {
			document.cookie = `dark=${dark}; path=/; max-age=31536000; samesite=lax`;
		}
	}, [dark]);

	useEffect(() => {
		if (i18n.language !== language) i18n.changeLanguage(language);
		if (typeof document !== 'undefined') {
			document.documentElement.lang = language;
			document.cookie = `lang=${language}; path=/; max-age=31536000; samesite=lax`;
		}
	}, [language]);

	return (
		<div
			//className="w-full flex items-center justify-between px-4 py-4 border-b h-auto min-h-0"
			className="w-full flex items-center justify-between px-4 py-4 border-b h-auto min-h-0 flex-shrink-0" // added flex-shrink-0
			id="sym:TopBar"
		>
			<div className="flex items-center gap-2 h-10">
				<Image src="/logo.png" alt={t('topbar.logoAlt')} width={629} height={179} style={{ height: "200%", width: "auto" }} />
			</div>
			<div className="flex items-center gap-4 ">
				{/* Language selector */}
				<Select value={language} onValueChange={(v) => setLanguage(v as any)}>
					<SelectTrigger className="w-32 shadow-none hover:bg-black/5" aria-label={t("topbar.language")}>
						<SelectValue placeholder={t("topbar.language")} />
					</SelectTrigger>
					<SelectContent>
						{(() => {
							const merged: { label: string; value: string }[] = [...baseLanguages];
							for (const tag of botLangs) {
								const exists = merged.some((x) => x.value === tag || x.value === tag.split('-')[0]);
								if (!exists) merged.push({ label: tag.toUpperCase(), value: tag });
							}
							return merged.map((l) => {
							const code = String(l.value).toUpperCase();
							const uiAvailable = true;
							const hasBot = !!botsByLang[l.value];

							let suffix = '';
							if (hasBot && uiAvailable) suffix = '';
							else if (hasBot && !uiAvailable) suffix = ` (${t('topbar.flag.rasaShort')})`;
							else if (!hasBot && uiAvailable) suffix = ` (${t('topbar.flag.uiShort')})`;

							return (
								<SelectItem key={l.value} value={l.value} className="">
									<span className="inline-flex items-center justify-between w-full gap-2 data-[highlighted]:text-white">
										<span>{l.label}</span>
										<span className="text-xs text-muted-foreground whitespace-nowrap">{code}{suffix}</span>
									</span>
								</SelectItem>
							)
							})
						})()}
					</SelectContent>
				</Select>
				{/* Theme selector */}
				{/* <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
					<SelectTrigger className="w-32" aria-label={t("topbar.theme")}>
						<SelectValue placeholder={t("topbar.theme")} />
					</SelectTrigger>
					<SelectContent>
						{themes.map((topt) => (
							<SelectItem key={topt.value} value={topt.value}>
								{t(topt.key)}
							</SelectItem>
						))}
					</SelectContent>
				</Select> */}
				
				<Button variant="ghost" className="border rounded hover:bg-black/75 hover:text-white transition-colors" onClick={() => setDark(!dark)} aria-label={t('topbar.toggleDarkMode')}>
					{dark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
				</Button>
				<Button variant="ghost" className="border rounded hover:bg-destructive hover:text-white transition-colors" onClick={() => signOut()} aria-label={t('topbar.logout')}>
					<LogOutIcon className="w-4 h-4" />
					{t( "topbar.logout")}
				</Button>
			</div>
		</div>
	);
}
