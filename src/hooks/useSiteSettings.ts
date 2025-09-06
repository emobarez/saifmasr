
"use client";

import { useState, useEffect, useMemo } from 'react';

const DEFAULT_PORTAL_NAME = "سيف مصر الوطنية للأمن";

export interface SiteSettings {
  portalName: string;
  maintenanceMode: boolean;
  adminEmail: string;
  companyPhone?: string;
  companyAddress?: string;
  publicEmail?: string;
  
  themeBackgroundLight?: string;
  themeForegroundLight?: string;
  themePrimaryLight?: string;
  themePrimaryForegroundLight?: string;
  themeAccentLight?: string;
  themeAccentForegroundLight?: string;
  themeCardLight?: string;
  themeCardForegroundLight?: string;
  themeSecondaryLight?: string;
  themeSecondaryForegroundLight?: string;
  themeMutedLight?: string;
  themeMutedForegroundLight?: string;
  themeBorderLight?: string;
  themeInputLight?: string;
  themeRingLight?: string;
  themePopoverLight?: string;
  themePopoverForegroundLight?: string;
  themeDestructiveLight?: string;
  themeDestructiveForegroundLight?: string;

  themeBackgroundDark?: string;
  themeForegroundDark?: string;
  themePrimaryDark?: string;
  themePrimaryForegroundDark?: string;
  themeAccentDark?: string;
  themeAccentForegroundDark?: string;
  themeCardDark?: string;
  themeCardForegroundDark?: string;
  themeSecondaryDark?: string;
  themeSecondaryForegroundDark?: string;
  themeMutedDark?: string;
  themeMutedForegroundDark?: string;
  themeBorderDark?: string;
  themeInputDark?: string;
  themeRingDark?: string;
  themePopoverDark?: string;
  themePopoverForegroundDark?: string;
  themeDestructiveDark?: string;
  themeDestructiveForegroundDark?: string;

  socialFacebookUrl?: string;
  socialTwitterUrl?: string;
  socialLinkedinUrl?: string;
  socialInstagramUrl?: string;

  themeSidebarBackgroundLight?: string;
  themeSidebarForegroundLight?: string;
  themeSidebarPrimaryLight?: string;
  themeSidebarPrimaryForegroundLight?: string;
  themeSidebarAccentLight?: string;
  themeSidebarAccentForegroundLight?: string;
  themeSidebarBorderLight?: string;
  themeSidebarRingLight?: string;

  themeSidebarBackgroundDark?: string;
  themeSidebarForegroundDark?: string;
  themeSidebarPrimaryDark?: string;
  themeSidebarPrimaryForegroundDark?: string;
  themeSidebarAccentDark?: string;
  themeSidebarAccentForegroundDark?: string;
  themeSidebarBorderDark?: string;
  themeSidebarRingDark?: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  portalName: DEFAULT_PORTAL_NAME,
  maintenanceMode: false,
  adminEmail: "admin@saifmasr.com",
  companyPhone: "",
  companyAddress: "",
  publicEmail: "",
  
  // Light Theme - Elite Maritime Style
  themeBackgroundLight: "210 25% 98%",
  themeForegroundLight: "210 15% 20%",
  themePrimaryLight: "195 100% 50%", // Bright teal/cyan
  themePrimaryForegroundLight: "210 100% 98%",
  themeAccentLight: "195 85% 45%", // Deeper teal
  themeAccentForegroundLight: "210 100% 98%",
  themeCardLight: "210 25% 100%",
  themeCardForegroundLight: "210 15% 20%",
  themePopoverLight: "210 25% 100%",
  themePopoverForegroundLight: "210 15% 20%",
  themeSecondaryLight: "210 25% 95%",
  themeSecondaryForegroundLight: "210 15% 25%",
  themeMutedLight: "210 25% 94%",
  themeMutedForegroundLight: "210 15% 45%",
  themeBorderLight: "210 25% 88%",
  themeInputLight: "210 25% 92%",
  themeRingLight: "195 100% 50%",
  themeDestructiveLight: "0 84% 60%",
  themeDestructiveForegroundLight: "210 100% 98%",

  // Dark Theme - Elite Maritime Dark Style  
  themeBackgroundDark: "210 25% 8%", // Very dark navy
  themeForegroundDark: "210 15% 92%",
  themePrimaryDark: "195 100% 65%", // Bright teal for dark mode
  themePrimaryForegroundDark: "210 25% 8%",
  themeAccentDark: "195 85% 55%", // Vibrant teal accent
  themeAccentForegroundDark: "210 25% 8%",
  themeCardDark: "210 25% 12%", // Dark navy cards
  themeCardForegroundDark: "210 15% 92%",
  themePopoverDark: "210 25% 15%",
  themePopoverForegroundDark: "210 15% 92%",
  themeSecondaryDark: "210 25% 18%",
  themeSecondaryForegroundDark: "210 15% 88%",
  themeMutedDark: "210 25% 18%",
  themeMutedForegroundDark: "210 15% 65%",
  themeBorderDark: "210 25% 22%",
  themeInputDark: "210 25% 20%",
  themeRingDark: "195 100% 65%",
  themeDestructiveDark: "0 75% 58%",
  themeDestructiveForegroundDark: "210 15% 92%",

  socialFacebookUrl: "",
  socialTwitterUrl: "",
  socialLinkedinUrl: "",
  socialInstagramUrl: "",

  // Sidebar Light Theme - Elite Style
  themeSidebarBackgroundLight: "210 30% 96%",
  themeSidebarForegroundLight: "210 15% 25%",
  themeSidebarPrimaryLight: "195 100% 50%",
  themeSidebarPrimaryForegroundLight: "210 100% 98%",
  themeSidebarAccentLight: "195 85% 45%",
  themeSidebarAccentForegroundLight: "210 100% 98%",
  themeSidebarBorderLight: "210 25% 85%",
  themeSidebarRingLight: "195 100% 50%",

  // Sidebar Dark Theme - Elite Maritime Dark
  themeSidebarBackgroundDark: "210 30% 5%", // Darker navy for sidebar
  themeSidebarForegroundDark: "210 15% 88%",
  themeSidebarPrimaryDark: "195 100% 65%",
  themeSidebarPrimaryForegroundDark: "210 30% 5%",
  themeSidebarAccentDark: "195 85% 55%",
  themeSidebarAccentForegroundDark: "210 30% 5%",
  themeSidebarBorderDark: "210 25% 18%",
  themeSidebarRingDark: "195 100% 65%",
};

export function useSiteSettings() {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoadingSiteSettings, setIsLoadingSiteSettings] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        const dbSettings = await response.json();
        if (isMounted) {
          // Transform database settings to match SiteSettings interface
          const settings: Partial<SiteSettings> = {
            portalName: dbSettings.portalName,
            maintenanceMode: dbSettings.maintenanceMode,
            adminEmail: dbSettings.adminEmail,
            companyPhone: dbSettings.companyPhone || undefined,
            companyAddress: dbSettings.companyAddress || undefined,
            publicEmail: dbSettings.publicEmail || undefined,
            // Add theme settings if they exist
            themeBackgroundLight: dbSettings.themeBackgroundLight || undefined,
            themeForegroundLight: dbSettings.themeForegroundLight || undefined,
            themePrimaryLight: dbSettings.themePrimaryLight || undefined,
            // Add other theme properties as needed
          };
          setSiteSettings(prev => ({ ...DEFAULT_SETTINGS, ...prev, ...settings }));
        }
      } catch (error) {
        console.error("useSiteSettings: Error fetching site settings:", error);
        if (isMounted) {
          setSiteSettings(DEFAULT_SETTINGS);
        }
      } finally {
        if (isMounted) {
          setIsLoadingSiteSettings(false);
        }
      }
    };
    
    fetchSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  return useMemo(() => ({
    ...siteSettings,
    isLoadingSiteSettings,
  }), [siteSettings, isLoadingSiteSettings]);
}
