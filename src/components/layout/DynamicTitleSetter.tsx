
"use client";

import { useEffect } from 'react';
import { usePortalName } from '@/hooks/usePortalName';

export function DynamicTitleSetter() {
  const { portalName } = usePortalName();
  useEffect(() => {
    if (portalName) {
      document.title = portalName;
    }
  }, [portalName]);
  return null; // This component doesn't render anything itself
}
