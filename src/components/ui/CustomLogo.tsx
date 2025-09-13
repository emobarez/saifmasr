import React from 'react';
import Image from 'next/image';

interface CustomLogoProps {
  className?: string;
}

export const CustomLogo: React.FC<CustomLogoProps> = ({ className = "h-6 w-6" }) => {
  return (
    <Image
      src="/saifmasr-logo.png"
      alt="Saif Masr Logo"
      width={32}
      height={32}
      className={className}
      priority
    />
  );
};