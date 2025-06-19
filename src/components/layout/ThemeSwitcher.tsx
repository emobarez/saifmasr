
"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import type { ComponentProps } from "react";

interface ThemeSwitcherProps extends Omit<ComponentProps<typeof Button>, "onClick" | "aria-label" | "variant" | "size" > {
  // We omit props that are set internally by ThemeSwitcher
}

export function ThemeSwitcher({ className, ...props }: ThemeSwitcherProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null); // Initialize theme as null

  useEffect(() => {
    // Determine initial theme
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    // Ensure window is defined for matchMedia (it will be in useEffect)
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = storedTheme || systemTheme;
    
    setTheme(initialTheme); // Set the theme state

    // Apply theme to HTML element
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Mark as mounted AFTER theme is determined and applied
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      // If prevTheme is null (shouldn't happen if mounted is true), default to 'light' for toggling
      const currentThemeForToggle = prevTheme || 'light';
      const newTheme = currentThemeForToggle === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return newTheme;
    });
  };

  if (!mounted || theme === null) { // If not mounted or theme not yet determined, render nothing
    return null; 
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme} 
      aria-label="Toggle theme" 
      className={className}
      {...props}
    >
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );
}

