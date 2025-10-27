import React from 'react';
import Image from 'next/image';

interface CustomLogoProps {
  className?: string;
}

export const CustomLogo: React.FC<CustomLogoProps> = ({ className = "h-10 w-10" }) => {
  return (
    <Image
      src="/saif.png"
      alt="Saif Masr Logo"
      width={64}
      height={64}
      className={className}
      priority
    />
  );
};