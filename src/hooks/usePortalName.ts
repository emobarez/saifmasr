
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const DEFAULT_PORTAL_NAME = "سيف مصر الوطنية للأمن";

export function usePortalName() {
  const [portalName, setPortalName] = useState<string>(DEFAULT_PORTAL_NAME);
  const [isLoadingPortalName, setIsLoadingPortalName] = useState(true);

  useEffect(() => {
    const fetchPortalName = async () => {
      setIsLoadingPortalName(true);
      try {
        const settingsDocRef = doc(db, "systemSettings", "general");
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists() && docSnap.data()?.portalName && docSnap.data().portalName.trim() !== "") {
          setPortalName(docSnap.data().portalName);
        } else {
          setPortalName(DEFAULT_PORTAL_NAME); // Fallback to default if not set or empty
        }
      } catch (error) {
        console.error("Error fetching portal name:", error);
        setPortalName(DEFAULT_PORTAL_NAME); // Fallback on error
      } finally {
        setIsLoadingPortalName(false);
      }
    };

    fetchPortalName();
  }, []);

  return { portalName, isLoadingPortalName };
}
