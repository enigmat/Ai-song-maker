import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text animate-gradient-x">
        AI Song Maker
      </h1>
      <p className="mt-2 text-lg text-gray-400">
        Turn your ideas into lyrical masterpieces.
      </p>
    </header>
  );
};

// Add keyframes for gradient animation to index.html if possible, or use a library.
// For now, we'll rely on a conceptual animation. You can add this to a style tag in index.html for it to work:
/*
@keyframes gradient-x {
    0%, 100% {
        background-size: 200% 200%;
        background-position: left center;
    }
    50% {
        background-size: 200% 200%;
        background-position: right center;
    }
}
.animate-gradient-x {
    animation: gradient-x 5s ease infinite;
}
*/
// Since we can't edit index.html to add styles, the class is for demonstration.
// Tailwind doesn't support this animation out-of-the-box without config.
