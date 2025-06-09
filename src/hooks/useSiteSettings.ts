
"use client";

import { useState, useEffect } from 'react';
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
}

// PRD Aligned Default Settings
const DEFAULT_SETTINGS: SiteSettings = {
  portalName: DEFAULT_PORTAL_NAME,
  maintenanceMode: false,
  adminEmail: "admin@saifmasr.com", 
  companyPhone: "",
  companyAddress: "",
  publicEmail: "",

  // Light Theme Defaults (PRD Aligned)
  themeBackgroundLight: "240 11% 89%", // Light Gray #E0E0E5
  themeForegroundLight: "238 10% 20%", // Dark Grayish Blue
  themePrimaryLight: "238 52% 38%", // Dark Blue #2E3192
  themePrimaryForegroundLight: "0 0% 98%", // White
  themeAccentLight: "191 55% 41%", // Teal #308EA3
  themeAccentForegroundLight: "0 0% 98%", // White
  themeCardLight: "0 0% 100% / 0.9",
  themeCardForegroundLight: "238 10% 20%",
  themePopoverLight: "0 0% 100% / 0.9",
  themePopoverForegroundLight: "238 10% 20%",
  themeSecondaryLight: "240 10% 94%",
  themeSecondaryForegroundLight: "238 10% 25%",
  themeMutedLight: "240 10% 75%",
  themeMutedForegroundLight: "240 10% 45%",
  themeBorderLight: "240 10% 78%",
  themeInputLight: "240 10% 92%",
  themeRingLight: "191 55% 41%", // Teal
  themeDestructiveLight: "0 84.2% 60.2%",
  themeDestructiveForegroundLight: "0 0% 98%",

  // Dark Theme Defaults (Derived from PRD Light)
  themeBackgroundDark: "238 10% 12%", // Darker Gray
  themeForegroundDark: "0 0% 90%", // Light Gray
  themePrimaryDark: "238 55% 65%", // Lighter Dark Blue
  themePrimaryForegroundDark: "0 0% 98%", // White
  themeAccentDark: "191 58% 55%", // Lighter Teal
  themeAccentForegroundDark: "0 0% 98%", // White
  themeCardDark: "238 10% 18% / 0.9",
  themeCardForegroundDark: "0 0% 90%",
  themePopoverDark: "238 10% 18% / 0.9",
  themePopoverForegroundDark: "0 0% 90%",
  themeSecondaryDark: "238 10% 22%",
  themeSecondaryForegroundDark: "0 0% 85%",
  themeMutedDark: "238 10% 30%",
  themeMutedForegroundDark: "0 0% 60%",
  themeBorderDark: "238 10% 25%",
  themeInputDark: "238 10% 25%",
  themeRingDark: "191 58% 55%", // Lighter Teal
  themeDestructiveDark: "0 70% 50%",
  themeDestructiveForegroundDark: "0 0% 98%",
  
  socialFacebookUrl: "",
  socialTwitterUrl: "",
  socialLinkedinUrl: "",
  socialInstagramUrl: "",
};

export function useSiteSettings() {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoadingSiteSettings, setIsLoadingSiteSettings] = useState(true);

  useEffect(() => {
    setIsLoadingSiteSettings(true);
    const settingsDocRef = doc(db, "systemSettings", "general");

    const unsubscribe = onSnapshot(settingsDocRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<SiteSettings>; // Cast to allow partial data
          setSiteSettings({
            portalName: data?.portalName?.trim() || DEFAULT_SETTINGS.portalName,
            maintenanceMode: data?.maintenanceMode === undefined ? DEFAULT_SETTINGS.maintenanceMode : data.maintenanceMode,
            adminEmail: data?.adminEmail || DEFAULT_SETTINGS.adminEmail,
            companyPhone: data?.companyPhone || DEFAULT_SETTINGS.companyPhone,
            companyAddress: data?.companyAddress || DEFAULT_SETTINGS.companyAddress,
            publicEmail: data?.publicEmail || DEFAULT_SETTINGS.publicEmail,

            // Light Theme
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

            // Dark Theme
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

  return { ...siteSettings, isLoadingSiteSettings };
}
