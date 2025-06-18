"use client";
import React, { useState } from "react";
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

export default function TopBar() {
	const [theme, setTheme] = useState<string>("default");

	const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		setTheme(value);
		if (value && value !== "default") {
			document.documentElement.setAttribute("data-theme", value);
		} else {
			document.documentElement.removeAttribute("data-theme");
		}
	};

	const [dark, setDark] = useState<boolean>(
		typeof window !== "undefined" && document.documentElement.classList.contains("dark")
	);

	const toggleDark = () => {
		setDark((prev) => {
			if (!prev) {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
			return !prev;
		});
	};

	return (
		<div className="w-full flex items-center justify-between px-4 py-2 border-b card-foreground">
			<div className="flex items-center gap-2">
				<Image src="/logo.png" alt="Logo" width={150} height={150} />
			</div>
			<div className="flex items-center gap-4">
				<Select
					value={theme}
					onValueChange={(value) => {
						setTheme(value);
						if (value && value !== "default") {
							document.documentElement.setAttribute("data-theme", value);
						} else {
							document.documentElement.removeAttribute("data-theme");
						}
					}}
				>
					<SelectTrigger className="w-[180px]">
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
					className="border rounded px-2 py-1"
					onClick={toggleDark}
					aria-label="Toggle dark mode"
				>
					{dark ? "🌙 Dark" : "☀️ Light"}
				</Button>
				<Button
					className="border rounded px-2 py-1"
					onClick={() => signOut()}
					aria-label="Logout"
				>
					Logout
				</Button>
			</div>
		</div>
	);
}
