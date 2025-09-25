import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="my-4 p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 px-4 py-1 text-sm font-semibold bg-red-800/60 text-white rounded-md hover:bg-red-700/60 border border-red-600 transition-colors"
          aria-label="Retry the last action"
        >
          Retry
        </button>
      )}
    </div>
  );
};
