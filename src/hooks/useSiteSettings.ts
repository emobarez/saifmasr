
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
}

const DEFAULT_SETTINGS: SiteSettings = {
  portalName: DEFAULT_PORTAL_NAME,
  maintenanceMode: false,
  adminEmail: "admin@saifmasr.com", 
  companyPhone: "",
  companyAddress: "",
  publicEmail: "",
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
            portalName: data?.portalName?.trim() || DEFAULT_PORTAL_NAME,
            maintenanceMode: data?.maintenanceMode || false,
            adminEmail: data?.adminEmail || DEFAULT_SETTINGS.adminEmail,
            companyPhone: data?.companyPhone || "",
            companyAddress: data?.companyAddress || "",
            publicEmail: data?.publicEmail || "",
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
