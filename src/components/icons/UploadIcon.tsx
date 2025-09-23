import React from 'react';

interface UploadIconProps {
  className?: string;
}

export const UploadIcon: React.FC<UploadIconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6h-.9a3 3 0 110 6H7z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 16l-4-4m0 0l-4 4m4-4v12" />
  </svg>
);