
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore'; // Added onSnapshot

const DEFAULT_PORTAL_NAME = "سيف مصر الوطنية للأمن";

export function usePortalName() {
  const [portalName, setPortalName] = useState<string>(DEFAULT_PORTAL_NAME);
  const [isLoadingPortalName, setIsLoadingPortalName] = useState(true);

  useEffect(() => {
    setIsLoadingPortalName(true);
    const settingsDocRef = doc(db, "systemSettings", "general");

    // Use onSnapshot to listen for real-time updates
    const unsubscribe = onSnapshot(settingsDocRef, 
      (docSnap) => {
        if (docSnap.exists() && docSnap.data()?.portalName && docSnap.data().portalName.trim() !== "") {
          setPortalName(docSnap.data().portalName);
        } else {
          setPortalName(DEFAULT_PORTAL_NAME); 
        }
        setIsLoadingPortalName(false);
      }, 
      (error) => {
        console.error("Error fetching portal name with snapshot:", error);
        setPortalName(DEFAULT_PORTAL_NAME); 
        setIsLoadingPortalName(false);
      }
    );

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);

  return { portalName, isLoadingPortalName };
}
