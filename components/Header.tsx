import React from 'react';

// SVG logo for MustBMusic, as a data URL.
const logoBase64 = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3cdefs%3e%3clinearGradient id='logoGradient' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3e%3cstop offset='0%25' stop-color='%23a855f7' /%3e%3cstop offset='50%25' stop-color='%23ec4899' /%3e%3cstop offset='100%25' stop-color='%23ef4444' /%3e%3c/linearGradient%3e%3c/defs%3e%3ccircle cx='50' cy='50' r='48' fill='url(%23logoGradient)'/%3e%3cpath d='M45,68.62C45,74.9,40.52,80,35,80S25,74.9,25,68.62S29.48,57.24,35,57.24V20h30v7.58c0,6.28-4.48,11.38-10,11.38s-10-5.1-10-11.38V35.1' stroke='white' stroke-width='6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e";

export const Header: React.FC = () => {
  return (
    <header className="text-center flex flex-col items-center">
      <img src={logoBase64} alt="Must B Music Logo" className="w-40 sm:w-48 h-auto mb-4 rounded-full" />
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text animate-gradient-x">
        MustBMusic Song Maker
      </h1>
      <p className="mt-2 text-lg text-gray-400">
        Your AI-powered music creation suite.
      </p>
    </header>
  );
};
