"use client";

import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

// Define a mapping from SiteSettings theme keys to CSS variable names
const themeKeyToCssVar: { [key: string]: string } = {
  themeBackground: '--background',
  themeForeground: '--foreground',
  themePrimary: '--primary',
  themePrimaryForeground: '--primary-foreground',
  themeAccent: '--accent',
  themeAccentForeground: '--accent-foreground',
  themeCard: '--card',
  themeCardForeground: '--card-foreground',
};

export function ThemeApplicator() {
  const siteSettings = useSiteSettings();
  const { isLoadingSiteSettings } = siteSettings;

  useEffect(() => {
    if (isLoadingSiteSettings) return; // Don't apply if settings are still loading

    // Iterate over the theme keys that are expected to be HSL strings
    Object.entries(themeKeyToCssVar).forEach(([settingKey, cssVarName]) => {
      const value = siteSettings[settingKey as keyof typeof siteSettings] as string | undefined;
      
      // The useSiteSettings hook provides defaults, so value should always be a string.
      // We apply it if it's a non-empty string.
      if (typeof value === 'string' && value.trim() !== '') {
        document.documentElement.style.setProperty(cssVarName, value.trim());
      }
      // If value is empty or not set (which shouldn't happen due to hook defaults),
      // the styles from globals.css will act as the ultimate fallback.
    });

  }, [siteSettings, isLoadingSiteSettings]); // Depend on the whole siteSettings object

  return null; // This component does not render anything itself
}
