import { zodResolver } from '@hookform/resolvers/zod';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Download, GripVertical, Home, LogOut, Pencil, Plus, Save, Settings, Trash2, Upload, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    LinkGroup,
    LinkRequest,
    Link as LinkType,
    updateLink,
    updateLinkGroup
} from '@/lib/api';

// Add password change schema
const passwordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const linkGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sort_order: z.coerce.number().int().nonnegative(),
});

const linkSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
  sort_order: z.coerce.number().int().nonnegative(),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;
type LinkGroupFormValues = z.infer<typeof linkGroupSchema>;
type LinkFormValues = z.infer<typeof linkSchema>;

type AdminView = 'linkGroups' | 'links' | 'systemConfig';

// Sortable item components
const SortableGroupItem = ({ group, onEdit, onDelete }: { 
  group: LinkGroup; 
  onEdit: (group: LinkGroup) => void;
  onDelete: (id: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: group.id.toString(),
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <TableRow ref={setNodeRef} style={style} className="group hover:bg-gray-50">
      <TableCell className="w-10">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2">
          <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
        </div>
      </TableCell>
      <TableCell className="font-medium">{group.name}</TableCell>
      <TableCell>{group.sort_order}</TableCell>
      <TableCell className="text-center">{group.links?.length || 0}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(group)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(group.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const SortableLinkItem = ({ link, onEdit, onDelete }: {
  link: LinkType;
  onEdit: (link: LinkType) => void;
  onDelete: (id: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: link.id.toString(),
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <TableRow ref={setNodeRef} style={style} className="group hover:bg-gray-50">
      <TableCell className="w-10">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2">
          <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
        </div>
      </TableCell>
      <TableCell className="font-medium">{link.name}</TableCell>
      <TableCell className="max-w-xs truncate">
        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          {link.url}
        </a>
      </TableCell>
      <TableCell>{link.sort_order}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(link)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(link.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const Admin: React.FC = () => {
  const { logout, username } = useAuth();
  const navigate = useNavigate();
  const [linkGroups, setLinkGroups] = useState<LinkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AdminView>('linkGroups');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for editing
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<number | null>(null);
  const [addingGroupMode, setAddingGroupMode] = useState(false);
  const [addingLinkMode, setAddingLinkMode] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

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
      sort_order: 0,
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Setup sensors for drag-n-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      setAddingGroupMode(false);
      groupForm.reset();
    } catch (err: any) {
      console.error('Failed to add group:', err);
      if (err.response && err.response.status === 401) {
        logout();
        navigate('/login');
        return;
      }
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
    } catch (err: any) {
      console.error('Failed to update group:', err);
      if (err.response && err.response.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      setError('Failed to update group');
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm('Are you sure you want to delete this group and all its links?')) return;
    
    try {
      await deleteLinkGroup(id);
      await loadLinkGroups();
    } catch (err: any) {
      console.error('Failed to delete group:', err);
      if (err.response && err.response.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      setError('Failed to delete group');
    }
  };

  // Link operations
  const handleAddLink = (groupId: number) => {
    setAddingLinkMode(groupId);
    linkForm.reset({
      name: '',
      url: '',
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
    } catch (err: any) {
      console.error('Failed to add link:', err);
      if (err.response && err.response.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      setError('Failed to add link');
    }
  };

  const handleEditLink = (link: LinkType) => {
    setEditingLinkId(link.id);
    linkForm.reset({
      name: link.name,
      url: link.url,
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
    } catch (err: any) {
      console.error('Failed to update link:', err);
      if (err.response && err.response.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      setError('Failed to update link');
    }
  };

  const handleDeleteLink = async (id: number) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    
    try {
      await deleteLink(id);
      await loadLinkGroups();
    } catch (err: any) {
      console.error('Failed to delete link:', err);
      if (err.response && err.response.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      setError('Failed to delete link');
    }
  };

  // Password operations
  const handleChangePassword = async (data: PasswordFormValues) => {
    try {
      await changePassword(data.oldPassword, data.newPassword);
      setPasswordChangeStatus({
        type: 'success',
        message: 'Password changed successfully'
      });
      passwordForm.reset();
    } catch (err: any) {
      console.error('Failed to change password:', err);
      if (err.response && err.response.status === 401) {
        setPasswordChangeStatus({
          type: 'error',
          message: 'Current password is incorrect'
        });
        return;
      }
      setPasswordChangeStatus({
        type: 'error',
        message: 'Failed to change password'
      });
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

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file) return;
    
    try {
      setImporting(true);
      setError(null);
      setImportStatus(null);
      
      await importData(file);
      await loadLinkGroups();
      
      setImportStatus('Data imported successfully');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Failed to import data:', err);
      setError('Failed to import data. Please check your file format.');
    } finally {
      setImporting(false);
    }
  };

  // Handle group reordering
  const handleGroupDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    setLinkGroups((groups) => {
      const oldIndex = groups.findIndex(g => g.id.toString() === active.id);
      const newIndex = groups.findIndex(g => g.id.toString() === over.id);
      
      const reorderedGroups = arrayMove(groups, oldIndex, newIndex);
      
      // Update sort orders
      const updatedGroups = reorderedGroups.map((group, index) => ({
        ...group,
        sort_order: index,
      }));
      
      // Save new order to backend
      updatedGroups.forEach(async (group) => {
        try {
          await updateLinkGroup(group.id, {
            name: group.name,
            sort_order: group.sort_order,
          });
        } catch (err) {
          console.error('Failed to update group order:', err);
        }
      });
      
      return updatedGroups;
    });
  };

  // Handle link reordering within a group
  const handleLinkDragEnd = async (event: DragEndEvent, groupId: number) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    setLinkGroups((groups) => {
      const groupIndex = groups.findIndex(g => g.id === groupId);
      if (groupIndex === -1) return groups;
      
      const group = groups[groupIndex];
      const links = [...group.links];
      
      const oldIndex = links.findIndex(link => link.id.toString() === active.id);
      const newIndex = links.findIndex(link => link.id.toString() === over.id);
      
      const reorderedLinks = arrayMove(links, oldIndex, newIndex);
      
      // Update sort orders
      const updatedLinks = reorderedLinks.map((link, index) => ({
        ...link,
        sort_order: index,
      }));
      
      // Save new order to backend
      updatedLinks.forEach(async (link) => {
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
      
      const updatedGroups = [...groups];
      updatedGroups[groupIndex] = {
        ...group,
        links: updatedLinks,
      };
      
      return updatedGroups;
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
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

      {/* Main Content */}
      <div className="flex-1">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <Button asChild variant="ghost" size="sm" className="mr-4">
                <RouterLink to="/">
                  <Home className="h-5 w-5" />
                </RouterLink>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Link Desk Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              {(currentView === 'linkGroups' || currentView === 'links') && (
                <>
                  <Button 
                    onClick={handleExport} 
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
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

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
            <>
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

                  {/* Group Edit Form */}
                  {editingGroupId !== null && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>Edit Group</CardTitle>
                      </CardHeader>
                      <CardContent>
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
                      </CardContent>
                    </Card>
                  )}

                  {/* Link Groups Table */}
                  {linkGroups.length === 0 && !addingGroupMode ? (
                    <div className="text-center py-8 text-gray-500">No link groups found. Add your first group!</div>
                  ) : (
                    <Card>
                      <CardContent className="p-0">
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleGroupDragEnd}
                        >
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-10"></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Sort Order</TableHead>
                                <TableHead className="text-center">Links</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <SortableContext
                                items={linkGroups.map(g => g.id.toString())}
                                strategy={verticalListSortingStrategy}
                              >
                                {linkGroups.map(group => (
                                  <SortableGroupItem
                                    key={group.id}
                                    group={group}
                                    onEdit={handleEditGroup}
                                    onDelete={handleDeleteGroup}
                                  />
                                ))}
                              </SortableContext>
                            </TableBody>
                          </Table>
                        </DndContext>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}

          {/* Links View */}
          {currentView === 'links' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Links</h2>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="space-y-8">
                  {/* Link Edit Form */}
                  {editingLinkId !== null && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>Edit Link</CardTitle>
                      </CardHeader>
                      <CardContent>
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
                      </CardContent>
                    </Card>
                  )}

                  {linkGroups.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No link groups found. Create a group first!</div>
                  ) : (
                    linkGroups.map(group => (
                      <Card key={group.id} className="overflow-hidden">
                        <CardHeader className="bg-gray-50 flex flex-row items-center justify-between">
                          <CardTitle>{group.name}</CardTitle>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleAddLink(group.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Link
                          </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                          {/* Add Link Form */}
                          {addingLinkMode === group.id && (
                            <div className="p-4 bg-gray-50 border-b">
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
                          )}

                          {/* Links Table */}
                          {group.links.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">No links in this group</div>
                          ) : (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(event) => handleLinkDragEnd(event, group.id)}
                            >
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-10"></TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>URL</TableHead>
                                    <TableHead>Sort Order</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <SortableContext
                                    items={group.links.map(link => link.id.toString())}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    {group.links.map(link => (
                                      <SortableLinkItem
                                        key={link.id}
                                        link={link}
                                        onEdit={handleEditLink}
                                        onDelete={handleDeleteLink}
                                      />
                                    ))}
                                  </SortableContext>
                                </TableBody>
                              </Table>
                            </DndContext>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </>
          )}

          {/* System Config View */}
          {currentView === 'systemConfig' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold">System Configuration</h2>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  {passwordChangeStatus && (
                    <div className={`mb-4 p-4 ${passwordChangeStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} rounded-md`}>
                      {passwordChangeStatus.message}
                    </div>
                  )}
                  
                  <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Current Password</label>
                      <Input type="password" {...passwordForm.register('oldPassword')} />
                      {passwordForm.formState.errors.oldPassword && (
                        <p className="text-sm text-red-500 mt-1">{passwordForm.formState.errors.oldPassword.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">New Password</label>
                      <Input type="password" {...passwordForm.register('newPassword')} />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-sm text-red-500 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                      <Input type="password" {...passwordForm.register('confirmPassword')} />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-500 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit">Change Password</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Admin; 