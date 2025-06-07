
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const DEFAULT_PORTAL_NAME = "سيف مصر الوطنية للأمن";

export interface SiteSettings { // Exporting the interface
  portalName: string;
  maintenanceMode: boolean;
  adminEmail: string;
  companyPhone?: string;
  companyAddress?: string;
  publicEmail?: string;
  themeBackground?: string;
  themeForeground?: string;
  themePrimary?: string;
  themePrimaryForeground?: string;
  themeAccent?: string;
  themeAccentForeground?: string;
  themeCard?: string;
  themeCardForeground?: string;
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
  themeBackground: "240 11% 89%",
  themeForeground: "238 10% 20%",
  themePrimary: "238 53% 37%",
  themePrimaryForeground: "0 0% 98%",
  themeAccent: "191 54% 41%",
  themeAccentForeground: "0 0% 98%",
  themeCard: "0 0% 100% / 0.85",
  themeCardForeground: "238 10% 20%",
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
            themeBackground: data?.themeBackground?.trim() || DEFAULT_SETTINGS.themeBackground,
            themeForeground: data?.themeForeground?.trim() || DEFAULT_SETTINGS.themeForeground,
            themePrimary: data?.themePrimary?.trim() || DEFAULT_SETTINGS.themePrimary,
            themePrimaryForeground: data?.themePrimaryForeground?.trim() || DEFAULT_SETTINGS.themePrimaryForeground,
            themeAccent: data?.themeAccent?.trim() || DEFAULT_SETTINGS.themeAccent,
            themeAccentForeground: data?.themeAccentForeground?.trim() || DEFAULT_SETTINGS.themeAccentForeground,
            themeCard: data?.themeCard?.trim() || DEFAULT_SETTINGS.themeCard,
            themeCardForeground: data?.themeCardForeground?.trim() || DEFAULT_SETTINGS.themeCardForeground,
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

