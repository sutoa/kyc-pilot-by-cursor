import React from 'react';
import Image from 'next/image';

const Logo = () => {
  return (
    <div className="mb-6 px-3 bg-gray-50">
      <div className="w-36 h-12">
        <Image
          src="/kyc_sidekick_orig.png"
          alt="KYC Sidekick Logo"
          width={144}
          height={48}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
};

export default Logo; 