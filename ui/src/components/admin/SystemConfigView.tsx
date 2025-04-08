import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordFormValues, passwordSchema } from './types';

interface SystemConfigViewProps {
  onChangePassword: (data: PasswordFormValues) => Promise<void>;
}

const SystemConfigView: React.FC<SystemConfigViewProps> = ({ onChangePassword }) => {
  const [status, setStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = async (data: PasswordFormValues) => {
    try {
      await onChangePassword(data);
      setStatus({
        type: 'success',
        message: 'Password changed successfully'
      });
      form.reset();
    } catch (err: any) {
      console.error('Password change error in component:', err);
      if (err.response && err.response.status === 401) {
        setStatus({
          type: 'error',
          message: 'Current password is incorrect'
        });
        return;
      }
      setStatus({
        type: 'error',
        message: 'Failed to change password'
      });
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">System Configuration</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          {status && (
            <div className={`mb-4 p-4 ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} rounded-md`}>
              {status.message}
            </div>
          )}
          
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Password</label>
              <Input type="password" {...form.register('oldPassword')} />
              {form.formState.errors.oldPassword && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.oldPassword.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <Input type="password" {...form.register('newPassword')} />
              {form.formState.errors.newPassword && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm New Password</label>
              <Input type="password" {...form.register('confirmPassword')} />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button type="submit">Change Password</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default SystemConfigView; 