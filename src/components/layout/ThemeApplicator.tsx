
"use client";

import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const themePropertiesMap = {
  Background: '--custom-background',
  Foreground: '--custom-foreground',
  Card: '--custom-card',
  CardForeground: '--custom-card-foreground',
  Popover: '--custom-popover', // Assuming popover uses card colors or similar base
  PopoverForeground: '--custom-popover-foreground',
  Primary: '--custom-primary',
  PrimaryForeground: '--custom-primary-foreground',
  Secondary: '--custom-secondary', // Less commonly customized, might map to card or background shades
  SecondaryForeground: '--custom-secondary-foreground',
  Muted: '--custom-muted', // Might be derived or set if distinct
  MutedForeground: '--custom-muted-foreground',
  Accent: '--custom-accent',
  AccentForeground: '--custom-accent-foreground',
  Destructive: '--custom-destructive', // Typically less customized, uses defaults
  DestructiveForeground: '--custom-destructive-foreground',
  Border: '--custom-border',
  Input: '--custom-input',
  Ring: '--custom-ring',
};

export function ThemeApplicator() {
  const siteSettings = useSiteSettings();
  const { isLoadingSiteSettings, ...settings } = siteSettings;

  useEffect(() => {
    if (isLoadingSiteSettings || !settings) return; 

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

  }, [settings, isLoadingSiteSettings]);

  return null; 
}
