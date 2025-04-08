import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LinkFormValues, LinkType, linkSchema } from '../types';

interface LinkFormProps {
  link?: LinkType;
  onSubmit: (data: LinkFormValues) => void;
  onCancel: () => void;
  isEditMode: boolean;
}

const LinkForm: React.FC<LinkFormProps> = ({ 
  link, 
  onSubmit, 
  onCancel, 
  isEditMode 
}) => {
  const form = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      name: link?.name || '',
      url: link?.url || '',
      sort_order: link?.sort_order || 0,
    },
  });

  return (
    <div className={isEditMode ? "" : "p-4 bg-gray-50 border-b"}>
      <Card className={isEditMode ? "" : "bg-white"}>
        {isEditMode && (
          <CardHeader>
            <CardTitle>Edit Link</CardTitle>
          </CardHeader>
        )}
        <CardContent className={isEditMode ? "" : "p-4"}>
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
                <label className="block text-sm font-medium mb-1">URL</label>
                <Input {...form.register('url')} />
                {form.formState.errors.url && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.url.message}</p>
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
                {isEditMode ? 'Save' : 'Save Link'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkForm; 