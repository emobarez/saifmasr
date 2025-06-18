
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

    // Check for essential Firebase config keys needed for Firestore to initialize
    // These checks rely on how NEXT_PUBLIC_ variables are exposed to the browser by Next.js
    const apiKey = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY : undefined;
    const projectId = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID : undefined;

    if (!apiKey || !projectId) {
        console.warn(
            "Firebase API Key or Project ID is missing from environment variables. " +
            "Site settings will use defaults and Firestore will not be connected for settings. " +
            "Ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set."
        );
        setSiteSettings(DEFAULT_SETTINGS);
        setIsLoadingSiteSettings(false);
        return; // Do not attempt to connect to Firestore
    }

    const settingsDocRef = doc(db, "systemSettings", "general");

    const unsubscribe = onSnapshot(settingsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<SiteSettings>;
          setSiteSettings({
            portalName: data?.portalName?.trim() || DEFAULT_SETTINGS.portalName,
            maintenanceMode: data?.maintenanceMode === undefined ? DEFAULT_SETTINGS.maintenanceMode : data.maintenanceMode,
            adminEmail: data?.adminEmail || DEFAULT_SETTINGS.adminEmail,
            companyPhone: data?.companyPhone || DEFAULT_SETTINGS.companyPhone,
            companyAddress: data?.companyAddress || DEFAULT_SETTINGS.companyAddress,
            publicEmail: data?.publicEmail || DEFAULT_SETTINGS.publicEmail,
            logoUrl: data?.logoUrl || DEFAULT_SETTINGS.logoUrl, 
            faviconUrl: data?.faviconUrl || DEFAULT_SETTINGS.faviconUrl, 

            themeBackgroundLight: data?.themeBackgroundLight?.trim() || DEFAULT_SETTINGS.themeBackgroundLight,
            themeForegroundLight: data?.themeForegroundLight?.trim() || DEFAULT_SETTINGS.themeForegroundLight,
            themePrimaryLight: data?.themePrimaryLight?.trim() || DEFAULT_SETTINGS.themePrimaryLight,
            themePrimaryForegroundLight: data?.themePrimaryForegroundLight?.trim() || DEFAULT_SETTINGS.themePrimaryForegroundLight,
            themeAccentLight: data?.themeAccentLight?.trim() || DEFAULT_SETTINGS.themeAccentLight,
            themeAccentForegroundLight: data?.themeAccentForegroundLight?.trim() || DEFAULT_SETTINGS.themeAccentForegroundLight,
            themeCardLight: data?.themeCardLight?.trim() || DEFAULT_SETTINGS.themeCardLight,
            themeCardForegroundLight: data?.themeCardForegroundLight?.trim() || DEFAULT_SETTINGS.themeCardForegroundLight,
            themePopoverLight: data?.themePopoverLight?.trim() || DEFAULT_SETTINGS.themePopoverLight,
            themePopoverForegroundLight: data?.themePopoverForegroundLight?.trim() || DEFAULT_SETTINGS.themePopoverForegroundLight,
            themeSecondaryLight: data?.themeSecondaryLight?.trim() || DEFAULT_SETTINGS.themeSecondaryLight,
            themeSecondaryForegroundLight: data?.themeSecondaryForegroundLight?.trim() || DEFAULT_SETTINGS.themeSecondaryForegroundLight,
            themeMutedLight: data?.themeMutedLight?.trim() || DEFAULT_SETTINGS.themeMutedLight,
            themeMutedForegroundLight: data?.themeMutedForegroundLight?.trim() || DEFAULT_SETTINGS.themeMutedForegroundLight,
            themeBorderLight: data?.themeBorderLight?.trim() || DEFAULT_SETTINGS.themeBorderLight,
            themeInputLight: data?.themeInputLight?.trim() || DEFAULT_SETTINGS.themeInputLight,
            themeRingLight: data?.themeRingLight?.trim() || DEFAULT_SETTINGS.themeRingLight,
            themeDestructiveLight: data?.themeDestructiveLight?.trim() || DEFAULT_SETTINGS.themeDestructiveLight,
            themeDestructiveForegroundLight: data?.themeDestructiveForegroundLight?.trim() || DEFAULT_SETTINGS.themeDestructiveForegroundLight,

            themeBackgroundDark: data?.themeBackgroundDark?.trim() || DEFAULT_SETTINGS.themeBackgroundDark,
            themeForegroundDark: data?.themeForegroundDark?.trim() || DEFAULT_SETTINGS.themeForegroundDark,
            themePrimaryDark: data?.themePrimaryDark?.trim() || DEFAULT_SETTINGS.themePrimaryDark,
            themePrimaryForegroundDark: data?.themePrimaryForegroundDark?.trim() || DEFAULT_SETTINGS.themePrimaryForegroundDark,
            themeAccentDark: data?.themeAccentDark?.trim() || DEFAULT_SETTINGS.themeAccentDark,
            themeAccentForegroundDark: data?.themeAccentForegroundDark?.trim() || DEFAULT_SETTINGS.themeAccentForegroundDark,
            themeCardDark: data?.themeCardDark?.trim() || DEFAULT_SETTINGS.themeCardDark,
            themeCardForegroundDark: data?.themeCardForegroundDark?.trim() || DEFAULT_SETTINGS.themeCardForegroundDark,
            themePopoverDark: data?.themePopoverDark?.trim() || DEFAULT_SETTINGS.themePopoverDark,
            themePopoverForegroundDark: data?.themePopoverForegroundDark?.trim() || DEFAULT_SETTINGS.themePopoverForegroundDark,
            themeSecondaryDark: data?.themeSecondaryDark?.trim() || DEFAULT_SETTINGS.themeSecondaryDark,
            themeSecondaryForegroundDark: data?.themeSecondaryForegroundDark?.trim() || DEFAULT_SETTINGS.themeSecondaryForegroundDark,
            themeMutedDark: data?.themeMutedDark?.trim() || DEFAULT_SETTINGS.themeMutedDark,
            themeMutedForegroundDark: data?.themeMutedForegroundDark?.trim() || DEFAULT_SETTINGS.themeMutedForegroundDark,
            themeBorderDark: data?.themeBorderDark?.trim() || DEFAULT_SETTINGS.themeBorderDark,
            themeInputDark: data?.themeInputDark?.trim() || DEFAULT_SETTINGS.themeInputDark,
            themeRingDark: data?.themeRingDark?.trim() || DEFAULT_SETTINGS.themeRingDark,
            themeDestructiveDark: data?.themeDestructiveDark?.trim() || DEFAULT_SETTINGS.themeDestructiveDark,
            themeDestructiveForegroundDark: data?.themeDestructiveForegroundDark?.trim() || DEFAULT_SETTINGS.themeDestructiveForegroundDark,

            socialFacebookUrl: data?.socialFacebookUrl || DEFAULT_SETTINGS.socialFacebookUrl,
            socialTwitterUrl: data?.socialTwitterUrl || DEFAULT_SETTINGS.socialTwitterUrl,
            socialLinkedinUrl: data?.socialLinkedinUrl || DEFAULT_SETTINGS.socialLinkedinUrl,
            socialInstagramUrl: data?.socialInstagramUrl || DEFAULT_SETTINGS.socialInstagramUrl,

            themeSidebarBackgroundLight: data?.themeSidebarBackgroundLight?.trim() || DEFAULT_SETTINGS.themeSidebarBackgroundLight,
            themeSidebarForegroundLight: data?.themeSidebarForegroundLight?.trim() || DEFAULT_SETTINGS.themeSidebarForegroundLight,
            themeSidebarPrimaryLight: data?.themeSidebarPrimaryLight?.trim() || DEFAULT_SETTINGS.themeSidebarPrimaryLight,
            themeSidebarPrimaryForegroundLight: data?.themeSidebarPrimaryForegroundLight?.trim() || DEFAULT_SETTINGS.themeSidebarPrimaryForegroundLight,
            themeSidebarAccentLight: data?.themeSidebarAccentLight?.trim() || DEFAULT_SETTINGS.themeSidebarAccentLight,
            themeSidebarAccentForegroundLight: data?.themeSidebarAccentForegroundLight?.trim() || DEFAULT_SETTINGS.themeSidebarAccentForegroundLight,
            themeSidebarBorderLight: data?.themeSidebarBorderLight?.trim() || DEFAULT_SETTINGS.themeSidebarBorderLight,
            themeSidebarRingLight: data?.themeSidebarRingLight?.trim() || DEFAULT_SETTINGS.themeSidebarRingLight,

            themeSidebarBackgroundDark: data?.themeSidebarBackgroundDark?.trim() || DEFAULT_SETTINGS.themeSidebarBackgroundDark,
            themeSidebarForegroundDark: data?.themeSidebarForegroundDark?.trim() || DEFAULT_SETTINGS.themeSidebarForegroundDark,
            themeSidebarPrimaryDark: data?.themeSidebarPrimaryDark?.trim() || DEFAULT_SETTINGS.themeSidebarPrimaryDark,
            themeSidebarPrimaryForegroundDark: data?.themeSidebarPrimaryForegroundDark?.trim() || DEFAULT_SETTINGS.themeSidebarPrimaryForegroundDark,
            themeSidebarAccentDark: data?.themeSidebarAccentDark?.trim() || DEFAULT_SETTINGS.themeSidebarAccentDark,
            themeSidebarAccentForegroundDark: data?.themeSidebarAccentForegroundDark?.trim() || DEFAULT_SETTINGS.themeSidebarAccentForegroundDark,
            themeSidebarBorderDark: data?.themeSidebarBorderDark?.trim() || DEFAULT_SETTINGS.themeSidebarBorderDark,
            themeSidebarRingDark: data?.themeSidebarRingDark?.trim() || DEFAULT_SETTINGS.themeSidebarRingDark,
          });
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
  }, []);

  return useMemo(() => ({
    ...siteSettings,
    isLoadingSiteSettings,
  }), [siteSettings, isLoadingSiteSettings]);
}

