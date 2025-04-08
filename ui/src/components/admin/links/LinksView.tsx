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
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LinkFormValues, LinkGroup, LinkRequest, LinkType } from '../types';
import LinkForm from './LinkForm';
import SortableLinkItem from './SortableLinkItem';

interface LinksViewProps {
  linkGroups: LinkGroup[];
  loading: boolean;
  onAddLink: (groupId: number, data: LinkFormValues) => Promise<void>;
  onUpdateLink: (linkId: number, groupId: number, data: LinkFormValues) => Promise<void>;
  onDeleteLink: (id: number) => Promise<void>;
  onReorderLinks: (groupId: number, reorderedLinks: LinkType[]) => void;
}

const LinksView: React.FC<LinksViewProps> = ({
  linkGroups,
  loading,
  onAddLink,
  onUpdateLink,
  onDeleteLink,
  onReorderLinks
}) => {
  const [editingLinkId, setEditingLinkId] = useState<number | null>(null);
  const [addingLinkMode, setAddingLinkMode] = useState<number | null>(null);

  // Setup sensors for drag-n-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddLink = (groupId: number) => {
    setAddingLinkMode(groupId);
  };

  const handleCancelAddLink = () => {
    setAddingLinkMode(null);
  };

  const handleCreateLink = async (data: LinkFormValues) => {
    if (addingLinkMode === null) return;
    
    try {
      await onAddLink(addingLinkMode, data);
      setAddingLinkMode(null);
    } catch (err) {
      console.error('Error adding link in component:', err);
    }
  };

  const handleEditLink = (link: LinkType) => {
    setEditingLinkId(link.id);
  };

  const handleCancelEditLink = () => {
    setEditingLinkId(null);
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
      await onUpdateLink(editingLinkId, groupId, data);
      setEditingLinkId(null);
    } catch (err) {
      console.error('Error updating link in component:', err);
    }
  };

  const handleLinkDragEnd = (event: DragEndEvent, groupId: number) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const groupIndex = linkGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;
    
    const group = linkGroups[groupIndex];
    if (!group) return;
    
    const links = [...group.links];
    
    const oldIndex = links.findIndex(link => link.id.toString() === active.id);
    const newIndex = links.findIndex(link => link.id.toString() === over.id);
    
    const reorderedLinks = arrayMove(links, oldIndex, newIndex);
    
    // Update sort orders
    const updatedLinks = reorderedLinks.map((link, index) => ({
      ...link,
      sort_order: index,
    }));
    
    onReorderLinks(groupId, updatedLinks);
  };

  return (
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
            <LinkForm
              link={(() => {
                for (const group of linkGroups) {
                  const link = group.links.find(l => l.id === editingLinkId);
                  if (link) return link;
                }
                return undefined;
              })()}
              onSubmit={handleUpdateLink}
              onCancel={handleCancelEditLink}
              isEditMode={true}
            />
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
                    <LinkForm
                      onSubmit={handleCreateLink}
                      onCancel={handleCancelAddLink}
                      isEditMode={false}
                    />
                  )}

                  {/* Links Table */}
                  {group.links == undefined || group.links == null || group.links.length === 0 ? (
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
                                onDelete={onDeleteLink}
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
  );
};

export default LinksView;