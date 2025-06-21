
"use client";

import { useEffect } from 'react'; 
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function DynamicHeadElementsSetter() {
  const { portalName, isLoadingSiteSettings } = useSiteSettings();

  useEffect(() => {
    if (isLoadingSiteSettings) return;

    if (portalName) {
      document.title = portalName;
    }
  }, [portalName, isLoadingSiteSettings]); 

  return null;
}
