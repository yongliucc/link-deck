import { Home, Settings } from 'lucide-react';
import React from 'react';

import { AdminView } from './types';

interface SidebarProps {
  currentView: AdminView;
  setCurrentView: (view: AdminView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  return (
    <div className="w-64 bg-white shadow-md min-h-screen">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Link Desk</h2>
        <div className="text-sm text-gray-600 mt-1">Admin Panel</div>
      </div>
      <nav className="mt-4">
        <div className="px-4 py-2 text-sm font-medium text-gray-600">Navigation</div>
        <button
          className={`w-full text-left px-4 py-2 flex items-center ${currentView === 'linkGroups' ? 'bg-gray-100 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
          onClick={() => setCurrentView('linkGroups')}
        >
          Link Groups
        </button>
        <button
          className={`w-full text-left px-4 py-2 flex items-center ${currentView === 'links' ? 'bg-gray-100 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
          onClick={() => setCurrentView('links')}
        >
          Links
        </button>
        <div className="px-4 py-2 mt-4 text-sm font-medium text-gray-600">Settings</div>
        <button
          className={`w-full text-left px-4 py-2 flex items-center ${currentView === 'systemConfig' ? 'bg-gray-100 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
          onClick={() => setCurrentView('systemConfig')}
        >
          <Settings className="h-4 w-4 mr-2" />
          System Config
        </button>
      </nav>
    </div>
  );
};

export default Sidebar; 