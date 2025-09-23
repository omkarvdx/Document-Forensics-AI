
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { SettingsIcon } from './icons/SettingsIcon';

export const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
          <ShieldCheckIcon className="h-8 w-8 text-cyan-400 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-white">Document Forensics AI</h1>
            <p className="text-sm text-gray-400">AI-Powered Tampering Detection</p>
          </div>
        </Link>

        {location.pathname === '/' && (
          <Link
            to="/config"
            className="flex items-center space-x-2 text-gray-300 hover:text-cyan-400 transition-colors duration-200"
          >
            <SettingsIcon className="h-5 w-5" />
            <span className="text-sm">Settings</span>
          </Link>
        )}
      </div>
    </header>
  );
};
