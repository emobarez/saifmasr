"use client";

import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings'; 

export function DynamicHeadElementsSetter() {
  const { portalName, faviconUrl, isLoadingSiteSettings } = useSiteSettings(); 

  useEffect(() => {
    if (isLoadingSiteSettings) return;

    if (portalName) {
      document.title = portalName;
    }

    if (faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon'; // Or appropriate type based on faviconUrl
        link.rel = 'shortcut icon'; // Standard rel
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = faviconUrl;
      
      // Attempt to update common iOS/Apple touch icons as well if only one faviconUrl is provided
      const appleTouchIconSelectors = [
        "link[rel='apple-touch-icon']",
        "link[rel='apple-touch-icon-precomposed']"
      ];
      appleTouchIconSelectors.forEach(selector => {
        let appleLink: HTMLLinkElement | null = document.querySelector(selector);
        if (!appleLink) {
          appleLink = document.createElement('link');
          appleLink.rel = selector.substring(selector.indexOf("'") + 1, selector.lastIndexOf("'")); // Extracts 'apple-touch-icon' etc.
          document.getElementsByTagName('head')[0].appendChild(appleLink);
        }
        appleLink.href = faviconUrl;
      });

    } else {
      // Optional: remove or set to a default favicon if faviconUrl is empty/null
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) {
         // Example: link.href = '/default-favicon.ico'; or document.getElementsByTagName('head')[0].removeChild(link);
         // For now, just leave it if it was set by public/favicon.ico
      }
    }
  }, [portalName, faviconUrl, isLoadingSiteSettings]);

  return null; 
}
