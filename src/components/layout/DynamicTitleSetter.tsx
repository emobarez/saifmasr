
"use client";

import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings'; // Updated import

export function DynamicTitleSetter() {
  const { portalName } = useSiteSettings(); // Updated hook usage
  useEffect(() => {
    if (portalName) {
      document.title = portalName;
    }
  }, [portalName]);
  return null; 
}
