
"use client";

import { useEffect } from 'react'; // Removed useState
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function DynamicHeadElementsSetter() {
  const { portalName, faviconUrl, isLoadingSiteSettings } = useSiteSettings();
  // Removed internal 'mounted' state

  useEffect(() => {
    // This component is now only rendered when AppInitializer has mounted.
    // So, we only need to check if settings are loaded.
    if (isLoadingSiteSettings) return;

    if (portalName) {
      document.title = portalName;
    }

    if (faviconUrl && faviconUrl.trim() !== '') {
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
    }
  }, [portalName, faviconUrl, isLoadingSiteSettings]); // Dependency on settings and their loading state

  return null;
}
