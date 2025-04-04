import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Trash2, Plus, LogOut, Save, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAdminLinkGroups,
  createLinkGroup,
  updateLinkGroup,
  deleteLinkGroup,
  createLink,
  updateLink,
  deleteLink,
  LinkGroup,
  Link as LinkType,
  LinkRequest,
  LinkGroupRequest
} from '@/lib/api';

const linkGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sort_order: z.coerce.number().int().nonnegative(),
});

const linkSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
  icon: z.string().optional(),
  sort_order: z.coerce.number().int().nonnegative(),
});

type LinkGroupFormValues = z.infer<typeof linkGroupSchema>;
type LinkFormValues = z.infer<typeof linkSchema>;

const Admin: React.FC = () => {
  const { logout, username } = useAuth();
  const navigate = useNavigate();
  const [linkGroups, setLinkGroups] = useState<LinkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for editing
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<number | null>(null);
  const [addingGroupMode, setAddingGroupMode] = useState(false);
  const [addingLinkMode, setAddingLinkMode] = useState<number | null>(null);

  // Forms
  const groupForm = useForm<LinkGroupFormValues>({
    resolver: zodResolver(linkGroupSchema),
    defaultValues: {
      name: '',
      sort_order: 0,
    },
  });

  const linkForm = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      name: '',
      url: '',
      icon: '',
      sort_order: 0,
    },
  });

  // Load link groups
  const loadLinkGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminLinkGroups();
      setLinkGroups(data);
    } catch (err) {
      console.error('Failed to load link groups:', err);
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
      setAddingGroupMode(false);
      groupForm.reset();
    } catch (err) {
      console.error('Failed to add group:', err);
      setError('Failed to add group');
    }
  };

  const handleEditGroup = (group: LinkGroup) => {
    setEditingGroupId(group.id);
    groupForm.reset({
      name: group.name,
      sort_order: group.sort_order,
    });
  };

  const handleUpdateGroup = async (data: LinkGroupFormValues) => {
    if (editingGroupId === null) return;
    
    try {
      await updateLinkGroup(editingGroupId, data);
      await loadLinkGroups();
      setEditingGroupId(null);
    } catch (err) {
      console.error('Failed to update group:', err);
      setError('Failed to update group');
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm('Are you sure you want to delete this group and all its links?')) return;
    
    try {
      await deleteLinkGroup(id);
      await loadLinkGroups();
    } catch (err) {
      console.error('Failed to delete group:', err);
      setError('Failed to delete group');
    }
  };

  // Link operations
  const handleAddLink = (groupId: number) => {
    setAddingLinkMode(groupId);
    linkForm.reset({
      name: '',
      url: '',
      icon: '',
      sort_order: 0,
    });
  };

  const handleCreateLink = async (data: LinkFormValues) => {
    if (addingLinkMode === null) return;
    
    try {
      const linkData: LinkRequest = {
        ...data,
        group_id: addingLinkMode,
      };
      
      await createLink(linkData);
      await loadLinkGroups();
      setAddingLinkMode(null);
      linkForm.reset();
    } catch (err) {
      console.error('Failed to add link:', err);
      setError('Failed to add link');
    }
  };

  const handleEditLink = (link: LinkType) => {
    setEditingLinkId(link.id);
    linkForm.reset({
      name: link.name,
      url: link.url,
      icon: link.icon || '',
      sort_order: link.sort_order,
    });
  };

  const handleUpdateLink = async (data: LinkFormValues) => {
    if (editingLinkId === null) return;
    
    // Find the link to get its group_id
    let groupId = 0;
    for (const group of linkGroups) {
      const link = group.links.find(l => l.id === editingLinkId);
      if (link) {
        groupId = link.group_id;
        break;
      }
    }
    
    try {
      const linkData: LinkRequest = {
        ...data,
        group_id: groupId,
      };
      
      await updateLink(editingLinkId, linkData);
      await loadLinkGroups();
      setEditingLinkId(null);
    } catch (err) {
      console.error('Failed to update link:', err);
      setError('Failed to update link');
    }
  };

  const handleDeleteLink = async (id: number) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    
    try {
      await deleteLink(id);
      await loadLinkGroups();
    } catch (err) {
      console.error('Failed to delete link:', err);
      setError('Failed to delete link');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Link Desk Admin</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Logged in as {username}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button 
              className="float-right font-bold"
              onClick={() => setError(null)}
            >
              &times;
            </button>
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Link Groups</h2>
          {!addingGroupMode && (
            <Button onClick={() => setAddingGroupMode(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Group
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Add Group Form */}
            {addingGroupMode && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Group</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={groupForm.handleSubmit(handleAddGroup)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <Input {...groupForm.register('name')} />
                        {groupForm.formState.errors.name && (
                          <p className="text-sm text-red-500 mt-1">{groupForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Sort Order</label>
                        <Input type="number" {...groupForm.register('sort_order')} />
                        {groupForm.formState.errors.sort_order && (
                          <p className="text-sm text-red-500 mt-1">{groupForm.formState.errors.sort_order.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setAddingGroupMode(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Save Group</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Link Groups */}
            {linkGroups.length === 0 && !addingGroupMode ? (
              <div className="text-center py-8 text-gray-500">No link groups found. Add your first group!</div>
            ) : (
              linkGroups.map(group => (
                <Card key={group.id} className="overflow-hidden">
                  {/* Group Header */}
                  {editingGroupId === group.id ? (
                    <CardHeader className="bg-gray-50">
                      <form onSubmit={groupForm.handleSubmit(handleUpdateGroup)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <Input {...groupForm.register('name')} />
                            {groupForm.formState.errors.name && (
                              <p className="text-sm text-red-500 mt-1">{groupForm.formState.errors.name.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Sort Order</label>
                            <Input type="number" {...groupForm.register('sort_order')} />
                            {groupForm.formState.errors.sort_order && (
                              <p className="text-sm text-red-500 mt-1">{groupForm.formState.errors.sort_order.message}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setEditingGroupId(null)}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <Button type="submit">
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                        </div>
                      </form>
                    </CardHeader>
                  ) : (
                    <CardHeader className="bg-gray-50 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          <span>{group.name}</span>
                          <span className="ml-2 text-sm text-gray-500">({group.sort_order})</span>
                        </CardTitle>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditGroup(group)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteGroup(group.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardHeader>
                  )}

                  {/* Links */}
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {(group.links || []).map(link => (
                        <div key={link.id} className="p-4">
                          {editingLinkId === link.id ? (
                            <form onSubmit={linkForm.handleSubmit(handleUpdateLink)} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium mb-1">Name</label>
                                  <Input {...linkForm.register('name')} />
                                  {linkForm.formState.errors.name && (
                                    <p className="text-sm text-red-500 mt-1">{linkForm.formState.errors.name.message}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">URL</label>
                                  <Input {...linkForm.register('url')} />
                                  {linkForm.formState.errors.url && (
                                    <p className="text-sm text-red-500 mt-1">{linkForm.formState.errors.url.message}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Icon (optional)</label>
                                  <Input {...linkForm.register('icon')} />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Sort Order</label>
                                  <Input type="number" {...linkForm.register('sort_order')} />
                                  {linkForm.formState.errors.sort_order && (
                                    <p className="text-sm text-red-500 mt-1">{linkForm.formState.errors.sort_order.message}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button type="button" variant="outline" onClick={() => setEditingLinkId(null)}>
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                                <Button type="submit">
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium">{link.name}</h3>
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                                  {link.url}
                                </a>
                                <div className="text-xs text-gray-500 mt-1">
                                  Sort Order: {link.sort_order}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditLink(link)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteLink(link.id)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add Link Form */}
                      {addingLinkMode === group.id ? (
                        <div className="p-4 bg-gray-50">
                          <h3 className="font-medium mb-4">Add New Link</h3>
                          <form onSubmit={linkForm.handleSubmit(handleCreateLink)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <Input {...linkForm.register('name')} />
                                {linkForm.formState.errors.name && (
                                  <p className="text-sm text-red-500 mt-1">{linkForm.formState.errors.name.message}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">URL</label>
                                <Input {...linkForm.register('url')} />
                                {linkForm.formState.errors.url && (
                                  <p className="text-sm text-red-500 mt-1">{linkForm.formState.errors.url.message}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Icon (optional)</label>
                                <Input {...linkForm.register('icon')} />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Sort Order</label>
                                <Input type="number" {...linkForm.register('sort_order')} />
                                {linkForm.formState.errors.sort_order && (
                                  <p className="text-sm text-red-500 mt-1">{linkForm.formState.errors.sort_order.message}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button type="button" variant="outline" onClick={() => setAddingLinkMode(null)}>
                                Cancel
                              </Button>
                              <Button type="submit">Save Link</Button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div className="p-4 border-t">
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={() => handleAddLink(group.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Link
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin; 