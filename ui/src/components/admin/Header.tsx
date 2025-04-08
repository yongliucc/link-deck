import { Download, Home, LogOut, Upload } from 'lucide-react';
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { AdminView } from './types';

interface HeaderProps {
  username: string;
  onLogout: () => void;
  currentView: AdminView;
  onExport: () => void;
  onImport: (file: File) => void;
  exporting: boolean;
  importing: boolean;
}

const Header: React.FC<HeaderProps> = ({
  username,
  onLogout,
  currentView,
  onExport,
  onImport,
  exporting,
  importing
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file) {
      onImport(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Button asChild variant="ghost" size="sm" className="mr-4">
            <Link to="/">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Link Desk Admin</h1>
        </div>
        <div className="flex items-center space-x-4">
          {(currentView === 'linkGroups' || currentView === 'links') && (
            <>
              <Button 
                onClick={onExport} 
                className="flex items-center gap-1"
                disabled={exporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export'}
              </Button>
              
              <Button 
                onClick={handleImportClick} 
                className="flex items-center gap-1"
                disabled={importing}
              >
                <Upload className="h-4 w-4 mr-2" />
                {importing ? 'Importing...' : 'Import'}
              </Button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept="application/json"
                className="hidden"
              />
            </>
          )}
          
          <span className="text-sm text-gray-600">Logged in as {username}</span>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header; 