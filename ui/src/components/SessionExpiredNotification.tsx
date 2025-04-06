import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const SessionExpiredNotification: React.FC = () => {
  const { isSessionExpired, clearExpiredSession } = useAuth();
  const navigate = useNavigate();

  if (!isSessionExpired) {
    return null;
  }

  const handleLoginClick = () => {
    clearExpiredSession();
    navigate('/login');
  };

  const handleDismiss = () => {
    clearExpiredSession();
  };

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 bg-orange-50 border border-orange-200 p-4 rounded-md shadow-md z-50">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-orange-800">Session Expired</h3>
          <p className="text-sm text-orange-700 mt-1">
            Your session has expired or you have been logged out. Please login again to continue.
          </p>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-orange-500 hover:text-orange-700"
        >
          <X size={18} />
        </button>
      </div>
      <div className="mt-3">
        <Button 
          onClick={handleLoginClick}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
        >
          Go to Login
        </Button>
      </div>
    </div>
  );
};

export default SessionExpiredNotification; 