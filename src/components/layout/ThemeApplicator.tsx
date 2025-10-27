
"use client";

import { useEffect } from 'react'; // Removed useState
import { useSiteSettings } from '@/hooks/useSiteSettings';

const themePropertiesMap = {
  // Main theme properties
  Background: '--custom-background',
  Foreground: '--custom-foreground',
  Card: '--custom-card',
  CardForeground: '--custom-card-foreground',
  Popover: '--custom-popover',
  PopoverForeground: '--custom-popover-foreground',
  Primary: '--custom-primary',
  PrimaryForeground: '--custom-primary-foreground',
  Secondary: '--custom-secondary',
  SecondaryForeground: '--custom-secondary-foreground',
  Muted: '--custom-muted',
  MutedForeground: '--custom-muted-foreground',
  Accent: '--custom-accent',
  AccentForeground: '--custom-accent-foreground',
  Destructive: '--custom-destructive',
  DestructiveForeground: '--custom-destructive-foreground',
  Border: '--custom-border',
  Input: '--custom-input',
  Ring: '--custom-ring',

  // Sidebar theme properties
  SidebarBackground: '--custom-sidebar-background',
  SidebarForeground: '--custom-sidebar-foreground',
  SidebarPrimary: '--custom-sidebar-primary',
  SidebarPrimaryForeground: '--custom-sidebar-primary-foreground',
  SidebarAccent: '--custom-sidebar-accent',
  SidebarAccentForeground: '--custom-sidebar-accent-foreground',
  SidebarBorder: '--custom-sidebar-border',
  SidebarRing: '--custom-sidebar-ring',
};

export function ThemeApplicator() {
  const siteSettings = useSiteSettings();
  const { isLoadingSiteSettings, ...settings } = siteSettings;
  // Removed internal 'mounted' state

  useEffect(() => {
    // This component is now only rendered when AppInitializer has mounted.
    // So, we only need to check if settings are loaded.
    if (isLoadingSiteSettings || !settings || Object.keys(settings).length === 0) return;

    const root = document.documentElement;

    Object.entries(themePropertiesMap).forEach(([baseName, cssVarPrefix]) => {
      const lightSettingKey = `theme${baseName}Light` as keyof typeof settings;
      const darkSettingKey = `theme${baseName}Dark` as keyof typeof settings;

      const lightValue = settings[lightSettingKey] as string | undefined;
      const darkValue = settings[darkSettingKey] as string | undefined;

      if (lightValue && lightValue.trim() !== '') {
        root.style.setProperty(`${cssVarPrefix}-light`, lightValue.trim());
      } else {
        root.style.removeProperty(`${cssVarPrefix}-light`);
      }
      
      if (darkValue && darkValue.trim() !== '') {
        root.style.setProperty(`${cssVarPrefix}-dark`, darkValue.trim());
      } else {
         root.style.removeProperty(`${cssVarPrefix}-dark`);
      }
    });

  }, [settings, isLoadingSiteSettings]); // Dependency on settings and their loading state

  return null; 
}
