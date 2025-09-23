import React from 'react';

interface ShieldExclamationIconProps {
  className?: string;
}

export const ShieldExclamationIcon: React.FC<ShieldExclamationIconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12c0 4.556-4.03 8.129-9 9-4.97-.871-9-4.444-9-9 0-.847.116-1.668.332-2.444l2.457-9.139a1.5 1.5 0 012.844 0L11 8.832V21z" opacity="0.3" />
  </svg>
);