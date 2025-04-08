import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { LinkGroup } from '../types';

interface SortableGroupItemProps {
  group: LinkGroup;
  onEdit: (group: LinkGroup) => void;
  onDelete: (id: number) => void;
}

const SortableGroupItem: React.FC<SortableGroupItemProps> = ({ group, onEdit, onDelete }) => {
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

export default SortableGroupItem; 