
"use client";

import { useEffect, useState } from 'react'; 
import { useSiteSettings } from '@/hooks/useSiteSettings'; 

export function DynamicHeadElementsSetter() {
  const { portalName, faviconUrl, isLoadingSiteSettings } = useSiteSettings(); 
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); 
  }, []);

  useEffect(() => {
    if (!mounted || isLoadingSiteSettings) return;

    if (portalName) {
      document.title = portalName;
    }

    if (faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon'; 
        link.rel = 'shortcut icon'; 
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = faviconUrl;
      
      const appleTouchIconSelectors = [
        "link[rel='apple-touch-icon']",
        "link[rel='apple-touch-icon-precomposed']"
      ];
      appleTouchIconSelectors.forEach(selector => {
        let appleLink: HTMLLinkElement | null = document.querySelector(selector);
        if (!appleLink) {
          appleLink = document.createElement('link');
          appleLink.rel = selector.substring(selector.indexOf("'") + 1, selector.lastIndexOf("'")); 
          document.getElementsByTagName('head')[0].appendChild(appleLink);
        }
        appleLink.href = faviconUrl;
      });

    } else {
      // Optional: remove or set to a default favicon if faviconUrl is empty/null
      // Current logic leaves it as is, which is fine if public/favicon.ico exists.
    }
  }, [portalName, faviconUrl, isLoadingSiteSettings, mounted]); 

  return null; 
}
