import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { LinkType } from '../types';

interface SortableLinkItemProps {
  link: LinkType;
  onEdit: (link: LinkType) => void;
  onDelete: (id: number) => void;
}

const SortableLinkItem: React.FC<SortableLinkItemProps> = ({ link, onEdit, onDelete }) => {
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

export default SortableLinkItem; 