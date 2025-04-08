import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LinkGroup, LinkGroupFormValues, linkGroupSchema } from '../types';

interface LinkGroupFormProps {
  group?: LinkGroup;
  onSubmit: (data: LinkGroupFormValues) => void;
  onCancel: () => void;
  isEditMode: boolean;
}

const LinkGroupForm: React.FC<LinkGroupFormProps> = ({ 
  group, 
  onSubmit, 
  onCancel, 
  isEditMode 
}) => {
  const form = useForm<LinkGroupFormValues>({
    resolver: zodResolver(linkGroupSchema),
    defaultValues: {
      name: group?.name || '',
      sort_order: group?.sort_order || 0,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Group' : 'Add New Group'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sort Order</label>
              <Input type="number" {...form.register('sort_order')} />
              {form.formState.errors.sort_order && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.sort_order.message}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              {isEditMode && <X className="h-4 w-4 mr-2" />}
              Cancel
            </Button>
            <Button type="submit">
              {isEditMode && <Save className="h-4 w-4 mr-2" />}
              {isEditMode ? 'Save' : 'Save Group'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LinkGroupForm; 