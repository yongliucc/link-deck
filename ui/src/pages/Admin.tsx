import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '@/components/admin/Header';
import LinksView from '@/components/admin/links/LinksView';
import LinkGroupsView from '@/components/admin/linkgroups/LinkGroupsView';
import Sidebar from '@/components/admin/Sidebar';
import SystemConfigView from '@/components/admin/SystemConfigView';
import { AdminView, LinkFormValues, LinkGroup, LinkGroupFormValues, LinkRequest, LinkType, PasswordFormValues } from '@/components/admin/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  changePassword,
  createLink,
  createLinkGroup,
  deleteLink,
  deleteLinkGroup,
  exportData,
  getAdminLinkGroups,
  importData,
  updateLink,
  updateLinkGroup
} from '@/lib/api';

const Admin: React.FC = () => {
  const { logout, username } = useAuth();
  const navigate = useNavigate();
  const [linkGroups, setLinkGroups] = useState<LinkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AdminView>('linkGroups');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load link groups
  const loadLinkGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminLinkGroups();
      setLinkGroups(data);
    } catch (err: any) {
      console.error('Failed to load link groups:', err);
      // Handle 401 errors specifically (should be handled by the interceptor, but as a fallback)
      if (err.response && err.response.status === 401) {
        console.log('Unauthorized access detected in Admin page, redirecting to login');
        logout();
        navigate('/login');
        return;
      }
      setError('Failed to load link groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinkGroups();
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Group operations
  const handleAddGroup = async (data: LinkGroupFormValues) => {
    try {
      await createLinkGroup(data);
      await loadLinkGroups();
      return Promise.resolve();
    } catch (err: any) {
      console.error('Failed to add group:', err);
      if (err.response && err.response.status === 401) {
        logout();
        navigate('/login');
      }
      setError('Failed to add group');
      return Promise.reject(err);
    }
  };

  const handleUpdateGroup = async (id: number, data: LinkGroupFormValues) => {
    try {
      await updateLinkGroup(id, data);
      await loadLinkGroups();
      return Promise.resolve();
    } catch (err: any) {
      console.error('Failed to update group:', err);
      if (err.response && err.response.status === 401) {
        logout();
        navigate('/login');
      }
      setError('Failed to update group');
      return Promise.reject(err);
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm('Are you sure you want to delete this group and all its links?')) return Promise.resolve();
    
    try {
      await deleteLinkGroup(id);
      await loadLinkGroups();
      return Promise.resolve();
    } catch (err: any) {
      console.error('Failed to delete group:', err);
      if (err.response && err.response.status === 401) {
        logout();
        navigate('/login');
      }
      setError('Failed to delete group');
      return Promise.reject(err);
    }
  };

  // Link operations
  const handleAddLink = async (groupId: number, data: LinkFormValues) => {
    try {
      const linkData: LinkRequest = {
        ...data,
        group_id: groupId,
      };
      
      await createLink(linkData);
      await loadLinkGroups();
      return Promise.resolve();
    } catch (err: any) {
      console.error('Failed to add link:', err);
      if (err.response && err.response.status === 401) {
        logout();
        navigate('/login');
      }
      setError('Failed to add link');
      return Promise.reject(err);
    }
  };

  const handleUpdateLink = async (id: number, groupId: number, data: LinkFormValues) => {
    try {
      const linkData: LinkRequest = {
        ...data,
        group_id: groupId,
      };
      
      await updateLink(id, linkData);
      await loadLinkGroups();
      return Promise.resolve();
    } catch (err: any) {
      console.error('Failed to update link:', err);
      if (err.response && err.response.status === 401) {
        logout();
        navigate('/login');
      }
      setError('Failed to update link');
      return Promise.reject(err);
    }
  };

  const handleDeleteLink = async (id: number) => {
    if (!confirm('Are you sure you want to delete this link?')) return Promise.resolve();
    
    try {
      await deleteLink(id);
      await loadLinkGroups();
      return Promise.resolve();
    } catch (err: any) {
      console.error('Failed to delete link:', err);
      if (err.response && err.response.status === 401) {
        logout();
        navigate('/login');
      }
      setError('Failed to delete link');
      return Promise.reject(err);
    }
  };

  // Password operations
  const handleChangePassword = async (data: PasswordFormValues) => {
    try {
      await changePassword(data.oldPassword, data.newPassword);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  };

  // Export/Import operations
  const handleExport = async () => {
    try {
      setError(null);
      setExporting(true);
      await exportData();
    } catch (err) {
      console.error('Failed to export data:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    try {
      setImporting(true);
      setError(null);
      setImportStatus(null);
      
      await importData(file);
      await loadLinkGroups();
      
      setImportStatus('Data imported successfully');
    } catch (err) {
      console.error('Failed to import data:', err);
      setError('Failed to import data. Please check your file format.');
    } finally {
      setImporting(false);
    }
  };

  // Handle group reordering
  const handleReorderGroups = (reorderedGroups: LinkGroup[]) => {
    setLinkGroups(reorderedGroups);
    
    // Save new order to backend
    reorderedGroups.forEach(async (group) => {
      try {
        await updateLinkGroup(group.id, {
          name: group.name,
          sort_order: group.sort_order,
        });
      } catch (err) {
        console.error('Failed to update group order:', err);
      }
    });
  };

  // Handle link reordering within a group
  const handleReorderLinks = (groupId: number, reorderedLinks: LinkType[]) => {
    const updatedGroups = linkGroups.map(group => {
      if (group.id === groupId) {
        return { ...group, links: reorderedLinks };
      }
      return group;
    });
    
    setLinkGroups(updatedGroups);
    
    // Save new order to backend
    reorderedLinks.forEach(async (link) => {
      try {
        await updateLink(link.id, {
          name: link.name,
          url: link.url,
          sort_order: link.sort_order,
          group_id: link.group_id,
        });
      } catch (err) {
        console.error('Failed to update link order:', err);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
      />

      {/* Main Content */}
      <div className="flex-1">
        <Header 
          username={username || ''}
          onLogout={handleLogout}
          currentView={currentView}
          onExport={handleExport}
          onImport={handleImport}
          exporting={exporting}
          importing={importing}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {importStatus && (
            <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-md">
              {importStatus}
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-md">
              {error}
            </div>
          )}

          {/* Link Groups View */}
          {currentView === 'linkGroups' && (
            <LinkGroupsView 
              linkGroups={linkGroups}
              loading={loading}
              onAddGroup={handleAddGroup}
              onUpdateGroup={handleUpdateGroup}
              onDeleteGroup={handleDeleteGroup}
              onReorderGroups={handleReorderGroups}
            />
          )}

          {/* Links View */}
          {currentView === 'links' && (
            <LinksView 
              linkGroups={linkGroups}
              loading={loading}
              onAddLink={handleAddLink}
              onUpdateLink={handleUpdateLink}
              onDeleteLink={handleDeleteLink}
              onReorderLinks={handleReorderLinks}
            />
          )}

          {/* System Config View */}
          {currentView === 'systemConfig' && (
            <SystemConfigView 
              onChangePassword={handleChangePassword}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Admin; 