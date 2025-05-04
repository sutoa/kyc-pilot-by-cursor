import React from 'react';
import Image from 'next/image';

const Logo = () => {
  return (
    <div className="px-3 bg-gray-50">
      <Image
        src="/kyc_sidekick_transparent.png"
        alt="KYC Sidekick Logo"
        width={128}
        height={28}
        className="object-contain"
        priority
      />
    </div>
  );
};

export default Logo; 