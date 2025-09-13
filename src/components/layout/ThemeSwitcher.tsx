
"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import type { ComponentProps } from "react";

// Helper function to safely get the stored theme
function getStoredTheme(): "light" | "dark" | null {
  try {
    // Ensure we are in a browser environment and localStorage is available and functional
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined" && window.localStorage !== null && typeof window.localStorage.getItem === 'function') {
      return localStorage.getItem("theme") as "light" | "dark" | null;
    }
  } catch (error) {
    console.warn("Could not access localStorage to get theme. This can happen in restricted environments like private browsing or sandboxed iframes.", error);
  }
  return null;
}

// Helper function to safely set the stored theme
function setStoredTheme(theme: "light" | "dark"): void {
  try {
    // Ensure we are in a browser environment and localStorage is available and functional
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined" && window.localStorage !== null && typeof window.localStorage.setItem === 'function') {
      localStorage.setItem("theme", theme);
    }
  } catch (error) {
    console.warn(`Could not access localStorage to set theme to '${theme}'.`, error);
  }
}

interface ThemeSwitcherProps extends Omit<ComponentProps<typeof Button>, "onClick" | "aria-label" | "variant" | "size" > {
  minimal?: boolean; // if true, render icon-only small button
}

export function ThemeSwitcher({ className, minimal = false, ...props }: ThemeSwitcherProps) {
  const [mounted, setMounted] = useState(false);
  // Default to 'light' to avoid null state and ensure a predictable initial state
  const [theme, setTheme] = useState<"light" | "dark">("light"); 

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted
    const storedTheme = getStoredTheme();
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = storedTheme || systemTheme;
    
    setTheme(initialTheme);
    setMounted(true);
  }, []);
  
  // This separate effect handles applying the theme class to the document's root
  // It runs whenever the 'theme' state changes.
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      setStoredTheme(newTheme); // Safely store the new theme
      return newTheme;
    });
  };

  if (!mounted) {
    // Render nothing on the server and during initial client render to avoid hydration mismatch
    return null; 
  }

  const icon = theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />

  if (minimal) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className={className}
        {...props}
      >
        {icon}
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`${className} flex items-center gap-2`}
      {...props}
    >
      {icon}
      <span className="hidden sm:inline">{theme === "light" ? "داكن" : "فاتح"}</span>
    </Button>
  )
}
