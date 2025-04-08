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
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LinkGroup, LinkGroupFormValues } from '../types';
import LinkGroupForm from './LinkGroupForm';
import SortableGroupItem from './SortableGroupItem';

interface LinkGroupsViewProps {
  linkGroups: LinkGroup[];
  loading: boolean;
  onAddGroup: (data: LinkGroupFormValues) => Promise<void>;
  onUpdateGroup: (id: number, data: LinkGroupFormValues) => Promise<void>;
  onDeleteGroup: (id: number) => Promise<void>;
  onReorderGroups: (reorderedGroups: LinkGroup[]) => void;
  onViewGroupLinks?: (groupId: number) => void;
}

const LinkGroupsView: React.FC<LinkGroupsViewProps> = ({
  linkGroups,
  loading,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  onReorderGroups,
  onViewGroupLinks
}) => {
  const [addingGroupMode, setAddingGroupMode] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);

  // Setup sensors for drag-n-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddGroup = async (data: LinkGroupFormValues) => {
    try {
      await onAddGroup(data);
      setAddingGroupMode(false);
    } catch (err) {
      console.error('Error adding group in component:', err);
    }
  };

  const handleEditGroup = (group: LinkGroup) => {
    setEditingGroupId(group.id);
  };

  const handleUpdateGroup = async (data: LinkGroupFormValues) => {
    if (editingGroupId === null) return;
    
    try {
      await onUpdateGroup(editingGroupId, data);
      setEditingGroupId(null);
    } catch (err) {
      console.error('Error updating group in component:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingGroupId(null);
  };

  const handleCancelAdd = () => {
    setAddingGroupMode(false);
  };

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const oldIndex = linkGroups.findIndex(g => g.id.toString() === active.id);
    const newIndex = linkGroups.findIndex(g => g.id.toString() === over.id);
    
    const reorderedGroups = arrayMove(linkGroups, oldIndex, newIndex);
    
    // Update sort orders
    const updatedGroups = reorderedGroups.map((group, index) => ({
      ...group,
      sort_order: index,
    }));
    
    onReorderGroups(updatedGroups);
  };

  return (
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
            <LinkGroupForm
              onSubmit={handleAddGroup}
              onCancel={handleCancelAdd}
              isEditMode={false}
            />
          )}

          {/* Group Edit Form */}
          {editingGroupId !== null && (
            <LinkGroupForm
              group={linkGroups.find(g => g.id === editingGroupId)}
              onSubmit={handleUpdateGroup}
              onCancel={handleCancelEdit}
              isEditMode={true}
            />
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
                            onDelete={onDeleteGroup}
                            onViewLinks={onViewGroupLinks}
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
  );
};

export default LinkGroupsView; 