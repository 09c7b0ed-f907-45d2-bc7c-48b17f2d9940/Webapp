"use client";
import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const themes = [
	{ label: "Default", value: "default" },
	{ label: "RES-Q", value: "resq" },
	{ label: "Green", value: "green" },
	{ label: "Red", value: "red" },
	{ label: "Magenta", value: "magenta" },
	{ label: "Blue", value: "blue" },
	{ label: "Yellow", value: "yellow" },
];

function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
	const [value, setValue] = useState<T>(defaultValue);

	useEffect(() => {
		try {
			const item = window.localStorage.getItem(key);
			if (item) {
				setValue(JSON.parse(item));
			}
		} catch (error) {
			console.warn(`Error reading localStorage key "${key}":`, error);
		}
	}, [key]);

	const setStoredValue = (newValue: T) => {
		try {
			setValue(newValue);
			window.localStorage.setItem(key, JSON.stringify(newValue));
		} catch (error) {
			console.warn(`Error setting localStorage key "${key}":`, error);
		}
	};

	return [value, setStoredValue];
}

export default function TopBar() {
	const [theme, setTheme] = useLocalStorage("theme", "default");
	const [dark, setDark] = useLocalStorage("darkMode", false);

	useEffect(() => {
		if (theme && theme !== "default") {
			document.documentElement.setAttribute("data-theme", theme);
		} else {
			document.documentElement.removeAttribute("data-theme");
		}
	}, [theme]);

	useEffect(() => {
		if (dark) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, [dark]);

	return (
		<div
			className="w-full flex items-center justify-between px-4 py-4 border-b h-auto min-h-0"
			id="sym:TopBar"
		>
			<div className="flex items-center gap-2 h-10">
				<Image src="/logo.png" alt="Logo" width={629} height={179} style={{ height: "200%", width: "auto" }} />
			</div>
			<div className="flex items-center gap-4">
				<Select value={theme} onValueChange={setTheme}>
					<SelectTrigger>
						<SelectValue placeholder="Theme" />
					</SelectTrigger>
					<SelectContent>
						{themes.map((t) => (
							<SelectItem key={t.value} value={t.value}>
								{t.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button
					className="border rounded"
					onClick={() => setDark(!dark)}
					aria-label="Toggle dark mode"
				>
					{dark ? "🌙 Dark" : "☀️ Light"}
				</Button>
				<Button
					className="border rounded"
					onClick={() => signOut()}
					aria-label="Logout"
				>
					Logout
				</Button>
			</div>
		</div>
	);
}
