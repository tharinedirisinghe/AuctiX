'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Shield, UserPlus, View } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AdminAddModal } from '@/components/molecules/adminAddModal';
import { type IRegisterAdmin, registerAdmin } from '@/services/authService';
import AxiosRequest from '@/services/axiosInspector';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { ViewAdminActionsLog } from '@/components/molecules/viewAdminActionsLog';

export default function AdminManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const axiosInstance = AxiosRequest().axiosInstance;
  const { toast } = useToast();

  const handleConfirm = async (form: IRegisterAdmin) => {
    setIsLoading(true);
    try {
      await registerAdmin(form, axiosInstance);
      toast({
        title: 'Success! Admin registered.',
        description: 'The new admin has been successfully registered.',
      });
      setTimeout(() => setIsModalOpen(false), 1000);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description:
          error.message || 'An error occurred while registering the admin.',
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
      throw new Error('Error registering admin: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="py-6 max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="h-8 w-8" />
          Admin Management
          {isLoading && (
            <Badge className="bg-yellow-500 text-gray-900">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </Badge>
          )}
        </h1>
        <p className="text-gray-500 mt-1">
          Manage system administrators and view their activities
        </p>
      </div>

      {/* Add Admin Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <UserPlus className="h-6 w-6" />
            Add New Administrator
          </CardTitle>
          <CardDescription>
            Register a new administrator to manage the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 pt-6">
            <div>
              <h3 className="text-lg font-medium text-gray-500">
                Administrator Registration
              </h3>
              <Separator className="my-4 border-gray-200 border-t-2" />
            </div>
            <div className="p-6 rounded-lg border-l-2 border-yellow-500 bg-gray-50">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-medium text-gray-900">
                    Add System Administrator
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Create a new administrator account with full system access
                  </p>
                </div>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Admin
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions Log */}
      <ViewAdminActionsLog />

      {/* Admin Add Modal */}
      <AdminAddModal
        isOpen={isModalOpen}
        onConfirm={handleConfirm}
        close={handleClose}
      />
    </div>
  );
}
