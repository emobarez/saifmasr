
"use client";

import { useState, useEffect, useMemo } from 'react'; 
import { db } from '@/lib/firebase'; // db might be undefined if Firebase init failed
import { doc, getDoc } from 'firebase/firestore';

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
  
  // Light Theme Defaults (Riplet CSS)
  themeBackgroundLight: "220 60% 98%",
  themeForegroundLight: "0 0% 20%",
  themePrimaryLight: "208 100% 34%",
  themePrimaryForegroundLight: "0 0% 100%",
  themeAccentLight: "199 100% 50%",
  themeAccentForegroundLight: "0 0% 100%",
  themeCardLight: "0 0% 100%",
  themeCardForegroundLight: "0 0% 20%",
  themePopoverLight: "0 0% 100%",
  themePopoverForegroundLight: "0 0% 20%",
  themeSecondaryLight: "220 20% 94%",
  themeSecondaryForegroundLight: "0 0% 20%",
  themeMutedLight: "220 20% 94%",
  themeMutedForegroundLight: "0 0% 40%",
  themeBorderLight: "220 20% 88%",
  themeInputLight: "220 20% 91%",
  themeRingLight: "199 100% 50%",
  themeDestructiveLight: "0 84.2% 60.2%",
  themeDestructiveForegroundLight: "0 0% 98%",

  // Dark Theme Defaults (Riplet CSS derived)
  themeBackgroundDark: "210 10% 15%",
  themeForegroundDark: "210 20% 90%",
  themePrimaryDark: "208 100% 70%",
  themePrimaryForegroundDark: "208 100% 10%",
  themeAccentDark: "199 100% 50%",
  themeAccentForegroundDark: "210 100% 10%",
  themeCardDark: "210 10% 20%",
  themeCardForegroundDark: "210 20% 90%",
  themePopoverDark: "210 10% 20%",
  themePopoverForegroundDark: "210 20% 90%",
  themeSecondaryDark: "210 10% 25%",
  themeSecondaryForegroundDark: "210 20% 90%",
  themeMutedDark: "210 10% 25%",
  themeMutedForegroundDark: "210 20% 60%",
  themeBorderDark: "210 10% 30%",
  themeInputDark: "210 10% 30%",
  themeRingDark: "199 100% 50%",
  themeDestructiveDark: "0 72% 51%",
  themeDestructiveForegroundDark: "0 0% 98%",

  socialFacebookUrl: "",
  socialTwitterUrl: "",
  socialLinkedinUrl: "",
  socialInstagramUrl: "",

  // Sidebar Light Theme Defaults (Riplet CSS derived)
  themeSidebarBackgroundLight: "0 0% 98%",
  themeSidebarForegroundLight: "0 0% 20%",
  themeSidebarPrimaryLight: "208 100% 34%",
  themeSidebarPrimaryForegroundLight: "0 0% 100%",
  themeSidebarAccentLight: "199 100% 50%",
  themeSidebarAccentForegroundLight: "0 0% 100%",
  themeSidebarBorderLight: "220 20% 88%",
  themeSidebarRingLight: "199 100% 50%",

  // Sidebar Dark Theme Defaults (Riplet CSS derived)
  themeSidebarBackgroundDark: "210 10% 18%",
  themeSidebarForegroundDark: "210 20% 90%",
  themeSidebarPrimaryDark: "208 100% 70%",
  themeSidebarPrimaryForegroundDark: "208 100% 10%",
  themeSidebarAccentDark: "199 100% 50%",
  themeSidebarAccentForegroundDark: "210 100% 10%",
  themeSidebarBorderDark: "210 10% 30%",
  themeSidebarRingDark: "199 100% 50%",
};

export function useSiteSettings() {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoadingSiteSettings, setIsLoadingSiteSettings] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      if (!db) {
        console.warn(
          "useSiteSettings: Firestore instance (db) is not available. " +
          "Site settings will use defaults and Firestore will not be connected for settings."
        );
        if (isMounted) {
          setSiteSettings(DEFAULT_SETTINGS);
          setIsLoadingSiteSettings(false);
        }
        return;
      }
      
      const settingsDocRef = doc(db, "systemSettings", "general");
      try {
        const docSnap = await getDoc(settingsDocRef);
        if (isMounted) {
          if (docSnap.exists()) {
            const data = docSnap.data() as Partial<SiteSettings>;
            setSiteSettings(prev => ({ ...DEFAULT_SETTINGS, ...prev, ...data }));
          } else {
            setSiteSettings(DEFAULT_SETTINGS);
          }
        }
      } catch (error) {
        console.error("useSiteSettings: Error fetching site settings with getDoc:", error);
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
