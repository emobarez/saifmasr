
"use client";

import { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const DEFAULT_PORTAL_NAME = "سيف مصر الوطنية للأمن";

export interface SiteSettings {
  portalName: string;
  maintenanceMode: boolean;
  adminEmail: string;
  companyPhone?: string;
  companyAddress?: string;
  publicEmail?: string;
  logoUrl?: string; 
  faviconUrl?: string; 

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
  logoUrl: "", 
  faviconUrl: "", 

  // Light Theme Defaults (PRD Aligned)
  themeBackgroundLight: "240 11% 89%", 
  themeForegroundLight: "238 10% 20%", 
  themePrimaryLight: "238 52% 38%", 
  themePrimaryForegroundLight: "0 0% 98%", 
  themeAccentLight: "191 55% 41%", 
  themeAccentForegroundLight: "0 0% 98%", 
  themeCardLight: "0 0% 100% / 0.9", 
  themeCardForegroundLight: "238 10% 20%",
  themePopoverLight: "0 0% 100% / 0.9",
  themePopoverForegroundLight: "238 10% 20%",
  themeSecondaryLight: "240 10% 94%", 
  themeSecondaryForegroundLight: "238 10% 25%", 
  themeMutedLight: "240 10% 80%", 
  themeMutedForegroundLight: "240 10% 45%",
  themeBorderLight: "240 10% 78%", 
  themeInputLight: "0 0% 100%", 
  themeRingLight: "191 55% 41%", 
  themeDestructiveLight: "0 84.2% 60.2%",
  themeDestructiveForegroundLight: "0 0% 98%",

  // Dark Theme Defaults (Replit/Elite Inspired)
  themeBackgroundDark: "222 84% 4.9%",    
  themeForegroundDark: "210 40% 98%",    
  themePrimaryDark: "217 91.2% 59.8%",  
  themePrimaryForegroundDark: "210 40% 98%", 
  themeAccentDark: "188 92% 50%",     
  themeAccentForegroundDark: "222 84% 4.9%",   
  themeCardDark: "222 80% 8%",       
  themeCardForegroundDark: "210 40% 96.1%",
  themePopoverDark: "222 80% 8%",
  themePopoverForegroundDark: "210 40% 96.1%",
  themeSecondaryDark: "217.2 32.6% 17.5%", 
  themeSecondaryForegroundDark: "210 40% 98%",
  themeMutedDark: "217.2 32.6% 17.5%",    
  themeMutedForegroundDark: "215 20.2% 65.1%", 
  themeBorderDark: "217.2 32.6% 17.5%",    
  themeInputDark: "217.2 32.6% 17.5%",     
  themeRingDark: "217 91.2% 59.8%",    
  themeDestructiveDark: "0 62.8% 30.6%",   
  themeDestructiveForegroundDark: "0 0% 98%",

  socialFacebookUrl: "",
  socialTwitterUrl: "",
  socialLinkedinUrl: "",
  socialInstagramUrl: "",

  // Sidebar Light Theme Defaults (PRD Aligned)
  themeSidebarBackgroundLight: "238 30% 95% / 0.9",
  themeSidebarForegroundLight: "238 15% 30%",
  themeSidebarPrimaryLight: "238 52% 38%",
  themeSidebarPrimaryForegroundLight: "0 0% 98%",
  themeSidebarAccentLight: "191 55% 41%",
  themeSidebarAccentForegroundLight: "0 0% 98%",
  themeSidebarBorderLight: "240 10% 85%",
  themeSidebarRingLight: "191 55% 41%",

  // Sidebar Dark Theme Defaults (Replit/Elite Inspired)
  themeSidebarBackgroundDark: "222 80% 6.5% / 0.9", 
  themeSidebarForegroundDark: "210 40% 90%",
  themeSidebarPrimaryDark: "217 91.2% 59.8%",
  themeSidebarPrimaryForegroundDark: "0 0% 98%",
  themeSidebarAccentDark: "188 92% 50%",
  themeSidebarAccentForegroundDark: "222 84% 4.9%",
  themeSidebarBorderDark: "217.2 32.6% 14%", 
  themeSidebarRingDark: "217 91.2% 59.8%",
};

export function useSiteSettings() {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoadingSiteSettings, setIsLoadingSiteSettings] = useState(true);

  useEffect(() => {
    setIsLoadingSiteSettings(true);

    const apiKey = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY : undefined;
    const projectId = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID : undefined;

    if (!apiKey || !projectId || !db) { // Check if db instance is available
        console.warn(
            "Firebase API Key, Project ID, or Firestore instance is missing/undefined. " +
            "Site settings will use defaults and Firestore will not be connected for settings. " +
            "Ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set, and Firebase initializes correctly."
        );
        setSiteSettings(DEFAULT_SETTINGS);
        setIsLoadingSiteSettings(false);
        return; 
    }

    const settingsDocRef = doc(db, "systemSettings", "general");

    const unsubscribe = onSnapshot(settingsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<SiteSettings>;
          // Merge fetched data with defaults to ensure all keys are present
          setSiteSettings(prev => ({ ...DEFAULT_SETTINGS, ...prev, ...data }));
        } else {
          setSiteSettings(DEFAULT_SETTINGS);
        }
        setIsLoadingSiteSettings(false);
      },
      (error) => {
        console.error("Error fetching site settings with snapshot:", error);
        setSiteSettings(DEFAULT_SETTINGS);
        setIsLoadingSiteSettings(false);
      }
    );

    return () => unsubscribe();
  }, []); // db is stable after initialization, so not strictly needed in deps if it's guaranteed to be set or unset consistently.

  return useMemo(() => ({
    ...siteSettings,
    isLoadingSiteSettings,
  }), [siteSettings, isLoadingSiteSettings]);
}
