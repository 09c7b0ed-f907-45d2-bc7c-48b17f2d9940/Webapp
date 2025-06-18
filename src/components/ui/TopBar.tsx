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
		<div
			className="w-full flex items-center justify-between px-4 py-4 border-b h-auto min-h-0"
			id="sym:TopBar"
		>
			<div className="flex items-center gap-2 h-10">
				<Image src="/logo.png" alt="Logo" width={629} height={179} style={{ height: "200%", width: "auto" }} />
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
					onClick={toggleDark}
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
