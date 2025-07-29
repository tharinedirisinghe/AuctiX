'use client';

import type React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ZodError, z } from 'zod';
import { Loader2, Lock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FormField } from '@/components/atoms/FormField';
import { AnimatedButton } from '@/components/atoms/AnimatedButton';
import {
  changePassword,
  type IChangePasswordData,
} from '@/services/userService';
import type { AxiosInstance } from 'axios';
import AxiosRequest from '@/services/axiosInspector';

const passwordUpdateSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

type PasswordUpdateFormData = z.infer<typeof passwordUpdateSchema>;

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function PasswordUpdateForm() {
  const [formData, setFormData] = useState<PasswordUpdateFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const axiosInstance: AxiosInstance = AxiosRequest().axiosInstance;

  const validateForm = (): boolean => {
    try {
      passwordUpdateSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof FormErrors] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    const data: IChangePasswordData = {
      oldPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    };

    changePassword(data, axiosInstance)
      .then(() => {
        toast({
          title: 'Success',
          description: 'Your password has been updated successfully.',
          variant: 'default',
        });
        // Reset form on success
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      })
      .catch((error) => {
        if (error.response?.status === 500) {
          toast({
            title: 'Error',
            description:
              'An unexpected error occurred. Please try again later.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description:
              error.response?.data?.message || 'Failed to update password.',
            variant: 'destructive',
          });
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const updateField =
    (field: keyof PasswordUpdateFormData) => (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  return (
    <div className="py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          Update Password
          {isLoading && (
            <Badge className="bg-yellow-500 text-gray-900">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Updating...
            </Badge>
          )}
        </h1>
        <p className="text-gray-500 mt-1">
          Keep your account secure by updating your password regularly
        </p>
      </div>

      {/* Password Update Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Password Security
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure. Make sure to
            choose a strong password with at least 6 characters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Current Password Section */}
            <div className="space-y-6 pt-6">
              <div>
                <h3 className="text-lg font-medium text-gray-500">
                  Current Password
                </h3>
                <Separator className="my-4 border-gray-200 border-t-2" />
              </div>
              <div className="p-6 rounded-lg border-l-2 border-yellow-500 bg-gray-50">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <FormField
                    label="Current Password"
                    id="currentPassword"
                    type="password"
                    placeholder="Enter your current password"
                    value={formData.currentPassword}
                    onChange={updateField('currentPassword')}
                    error={errors.currentPassword}
                    delay={0.2}
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Enter your current password to verify your identity
                  </p>
                </motion.div>
              </div>
            </div>

            {/* New Password Section */}
            <div className="space-y-6 pt-12">
              <div>
                <h3 className="text-lg font-medium text-gray-500">
                  New Password
                </h3>
                <Separator className="my-4 border-gray-200 border-t-2" />
              </div>
              <div className="p-6 rounded-lg border-l-2 border-yellow-500 bg-gray-50">
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <FormField
                      label="New Password"
                      id="newPassword"
                      type="password"
                      placeholder="Enter your new password"
                      value={formData.newPassword}
                      onChange={updateField('newPassword')}
                      error={errors.newPassword}
                      delay={0.4}
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <FormField
                      label="Confirm New Password"
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your new password"
                      value={formData.confirmPassword}
                      onChange={updateField('confirmPassword')}
                      error={errors.confirmPassword}
                      delay={0.6}
                    />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 flex justify-end">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <AnimatedButton
                  type="submit"
                  loading={isLoading}
                  className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating Password...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </AnimatedButton>
              </motion.div>
            </div>
          </motion.form>
        </CardContent>
      </Card>
    </div>
  );
}
