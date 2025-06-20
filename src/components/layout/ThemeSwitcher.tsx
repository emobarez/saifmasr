
"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import type { ComponentProps } from "react";

interface ThemeSwitcherProps extends Omit<ComponentProps<typeof Button>, "onClick" | "aria-label" | "variant" | "size" > {
  // We omit props that are set internally by ThemeSwitcher
}

// Function to safely access localStorage
const getStoredTheme = (): "light" | "dark" | null => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("theme") as "light" | "dark" | null;
    }
  } catch (e) {
    console.warn("ThemeSwitcher: localStorage is not available or accessible.", e);
  }
  return null;
};

const setStoredTheme = (theme: "light" | "dark"): void => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("theme", theme);
    }
  } catch (e) {
    console.warn("ThemeSwitcher: localStorage is not available or accessible for setting theme.", e);
  }
};

export function ThemeSwitcher({ className, ...props }: ThemeSwitcherProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    // Determine initial theme
    let initialTheme: "light" | "dark";
    const storedTheme = getStoredTheme();
    
    if (typeof window !== "undefined") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      initialTheme = storedTheme || systemTheme;
    } else {
      // Fallback for non-browser environments (though "use client" should prevent this for logic)
      initialTheme = "light"; 
    }
    
    setTheme(initialTheme); 

    // Apply theme to HTML element
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const currentThemeForToggle = prevTheme || (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const newTheme = currentThemeForToggle === "light" ? "dark" : "light";
      
      setStoredTheme(newTheme); // Safely set stored theme

      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return newTheme;
    });
  };

  if (!mounted || theme === null) { 
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
