
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
  themeBorderLight?: string;
  themeInputLight?: string;
  themeRingLight?: string;

  themeBackgroundDark?: string;
  themeForegroundDark?: string;
  themePrimaryDark?: string;
  themePrimaryForegroundDark?: string;
  themeAccentDark?: string;
  themeAccentForegroundDark?: string;
  themeCardDark?: string;
  themeCardForegroundDark?: string;
  themeBorderDark?: string;
  themeInputDark?: string;
  themeRingDark?: string;

  socialFacebookUrl?: string;
  socialTwitterUrl?: string;
  socialLinkedinUrl?: string;
  socialInstagramUrl?: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  portalName: DEFAULT_PORTAL_NAME,
  maintenanceMode: false,
  adminEmail: "admin@saifmasr.com", 
  companyPhone: "",
  companyAddress: "",
  publicEmail: "",

  themeBackgroundLight: "240 11% 89%",
  themeForegroundLight: "238 10% 20%",
  themePrimaryLight: "238 53% 37%",
  themePrimaryForegroundLight: "0 0% 98%",
  themeAccentLight: "191 54% 41%",
  themeAccentForegroundLight: "0 0% 98%",
  themeCardLight: "0 0% 100% / 0.85",
  themeCardForegroundLight: "238 10% 20%",
  themeBorderLight: "240 10% 80%",
  themeInputLight: "240 10% 85%",
  themeRingLight: "191 54% 41%",

  themeBackgroundDark: "238 10% 15%",
  themeForegroundDark: "0 0% 95%",
  themePrimaryDark: "238 60% 55%",
  themePrimaryForegroundDark: "0 0% 98%",
  themeAccentDark: "191 60% 50%",
  themeAccentForegroundDark: "0 0% 98%",
  themeCardDark: "238 10% 20% / 0.85",
  themeCardForegroundDark: "0 0% 95%",
  themeBorderDark: "238 10% 30%",
  themeInputDark: "238 10% 30%",
  themeRingDark: "191 60% 50%",

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
          const data = docSnap.data();
          setSiteSettings({
            portalName: data?.portalName?.trim() || DEFAULT_SETTINGS.portalName,
            maintenanceMode: data?.maintenanceMode || false,
            adminEmail: data?.adminEmail || DEFAULT_SETTINGS.adminEmail,
            companyPhone: data?.companyPhone || "",
            companyAddress: data?.companyAddress || "",
            publicEmail: data?.publicEmail || "",

            themeBackgroundLight: data?.themeBackgroundLight?.trim() || DEFAULT_SETTINGS.themeBackgroundLight,
            themeForegroundLight: data?.themeForegroundLight?.trim() || DEFAULT_SETTINGS.themeForegroundLight,
            themePrimaryLight: data?.themePrimaryLight?.trim() || DEFAULT_SETTINGS.themePrimaryLight,
            themePrimaryForegroundLight: data?.themePrimaryForegroundLight?.trim() || DEFAULT_SETTINGS.themePrimaryForegroundLight,
            themeAccentLight: data?.themeAccentLight?.trim() || DEFAULT_SETTINGS.themeAccentLight,
            themeAccentForegroundLight: data?.themeAccentForegroundLight?.trim() || DEFAULT_SETTINGS.themeAccentForegroundLight,
            themeCardLight: data?.themeCardLight?.trim() || DEFAULT_SETTINGS.themeCardLight,
            themeCardForegroundLight: data?.themeCardForegroundLight?.trim() || DEFAULT_SETTINGS.themeCardForegroundLight,
            themeBorderLight: data?.themeBorderLight?.trim() || DEFAULT_SETTINGS.themeBorderLight,
            themeInputLight: data?.themeInputLight?.trim() || DEFAULT_SETTINGS.themeInputLight,
            themeRingLight: data?.themeRingLight?.trim() || DEFAULT_SETTINGS.themeRingLight,

            themeBackgroundDark: data?.themeBackgroundDark?.trim() || DEFAULT_SETTINGS.themeBackgroundDark,
            themeForegroundDark: data?.themeForegroundDark?.trim() || DEFAULT_SETTINGS.themeForegroundDark,
            themePrimaryDark: data?.themePrimaryDark?.trim() || DEFAULT_SETTINGS.themePrimaryDark,
            themePrimaryForegroundDark: data?.themePrimaryForegroundDark?.trim() || DEFAULT_SETTINGS.themePrimaryForegroundDark,
            themeAccentDark: data?.themeAccentDark?.trim() || DEFAULT_SETTINGS.themeAccentDark,
            themeAccentForegroundDark: data?.themeAccentForegroundDark?.trim() || DEFAULT_SETTINGS.themeAccentForegroundDark,
            themeCardDark: data?.themeCardDark?.trim() || DEFAULT_SETTINGS.themeCardDark,
            themeCardForegroundDark: data?.themeCardForegroundDark?.trim() || DEFAULT_SETTINGS.themeCardForegroundDark,
            themeBorderDark: data?.themeBorderDark?.trim() || DEFAULT_SETTINGS.themeBorderDark,
            themeInputDark: data?.themeInputDark?.trim() || DEFAULT_SETTINGS.themeInputDark,
            themeRingDark: data?.themeRingDark?.trim() || DEFAULT_SETTINGS.themeRingDark,
            
            socialFacebookUrl: data?.socialFacebookUrl || "",
            socialTwitterUrl: data?.socialTwitterUrl || "",
            socialLinkedinUrl: data?.socialLinkedinUrl || "",
            socialInstagramUrl: data?.socialInstagramUrl || "",
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
