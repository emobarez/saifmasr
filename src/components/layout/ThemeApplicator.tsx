"use client";

import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

// Define a mapping from SiteSettings theme keys to CSS variable names
// This mapping is kept for potential future use but the direct style application is removed for now.
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
    if (isLoadingSiteSettings) return; 

    // The following block is commented out to prevent ThemeApplicator
    // from setting inline styles, which would override the .dark class
    // styles defined in globals.css. The ThemeSwitcher component
    // is responsible for toggling the .dark class on the HTML element.
    // If dynamic theming from Firestore settings is desired in conjunction
    // with light/dark mode, this component and globals.css would need
    // a more sophisticated integration.
    /*
    Object.entries(themeKeyToCssVar).forEach(([settingKey, cssVarName]) => {
      const value = siteSettings[settingKey as keyof typeof siteSettings] as string | undefined;
      
      if (typeof value === 'string' && value.trim() !== '') {
        document.documentElement.style.setProperty(cssVarName, value.trim());
      }
    });
    */

  }, [siteSettings, isLoadingSiteSettings]);

  return null; 
}