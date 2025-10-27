
"use client";
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined); // Start as undefined

  React.useEffect(() => {
    const updateMobileState = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    updateMobileState(); // Set on mount
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", updateMobileState);
    
    return () => mql.removeEventListener("change", updateMobileState);
  }, []);

  return isMobile; // Return boolean | undefined
}
