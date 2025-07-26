import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ViewAdminActionsLog } from '@/components/molecules/viewAdminActionsLog';
import { IRegisterAdmin, registerAdmin } from '@/services/authService';
import AxiosRequest from '@/services/axiosInspector';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { AdminAddModal } from '@/components/molecules/adminAddModal';

export default function AdminManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const axiosInstance = AxiosRequest().axiosInstance;
  const { toast } = useToast();

  const handleConfirm = async (form: IRegisterAdmin) => {
    await registerAdmin(form, axiosInstance)
      .then(() => {
        toast({
          title: 'Success! Admin registered.',
          description: 'The new admin has been successfully registered.',
        });
        setTimeout(() => setIsModalOpen(false), 1000);
      })
      .catch((error: Error) => {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description:
            error.message || 'An error occurred while registering the admin.',
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        });
        throw new Error('Error registering admin: ' + error.message);
      });
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="container py-10 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Admin Management</CardTitle>
            <CardDescription>
              Add new administrators to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto"
            >
              Add Admin
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <ViewAdminActionsLog />
      <AdminAddModal
        isOpen={isModalOpen}
        onConfirm={handleConfirm}
        close={handleClose}
      />
    </div>
  );
}
