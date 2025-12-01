"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    // Check localStorage or preference on mount
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark" || storedTheme === "light") {
      setTheme(storedTheme);
      document.documentElement.classList.toggle("dark", storedTheme === "dark");
      document.documentElement.classList.toggle("theme-dark", storedTheme === "dark");
      document.documentElement.classList.toggle("theme-light", storedTheme === "light");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark", "theme-dark");
    } else {
      setTheme("light");
      document.documentElement.classList.add("theme-light");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Toggle classes
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    document.documentElement.classList.toggle("theme-dark", newTheme === "dark");
    document.documentElement.classList.toggle("theme-light", newTheme === "light");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="rounded-full w-9 h-9 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
    >
      {theme === "light" ? (
        <Sun className="h-4 w-4 transition-all" />
      ) : (
        <Moon className="h-4 w-4 transition-all" />
      )}
    </Button>
  );
}
