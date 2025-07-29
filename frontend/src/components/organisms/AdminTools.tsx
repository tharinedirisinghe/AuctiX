import React, { useEffect, useState } from 'react';
import { RemoveProfilePictureModal } from './RemoveProfilePictureModal';
import { BanUserModal } from '../molecules/BanUserModal';
import AxiosRequest from '@/services/axiosInspector';
import { getServerErrorMessage } from '@/lib/errorMsg';
import { banUser, deleteProfilePhoto } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';

export enum AdminToolsEnum {
  BAN_USER = 'banUser',
  REMOVE_PROFILE_PICTURE = 'removeProfilePicture',
}

export default function AdminTools() {
  const [isBanUserModalOpen, setIsBanUserModalOpen] = useState(false);
  const [isRemoveProfilePictureModalOpen, setIsRemoveProfilePictureModalOpen] =
    useState(false);
  const axiosInstance = AxiosRequest().axiosInstance;
  const { toast } = useToast();
  const adminTools = useAppSelector((state) => state.adminTools);

  const banUserHandler = (reason: string) => {
    console.log(
      'Banning user:',
      adminTools?.selectedUsername,
      'Reason:',
      reason,
    );
    if (!adminTools?.selectedUsername) {
      console.error('No user selected for banning');
      return;
    }
    banUser(axiosInstance, adminTools.selectedUsername, reason)
      .then((response) => {
        console.log('User banned successfully:', response);
        toast({
          title: 'Success',
          description: `User ${adminTools.selectedUsername} has been banned.`,
        });
      })
      .catch((error: Error) => {
        console.error('Error banning user:', error);
        toast({
          title: 'Error',
          description: getServerErrorMessage(error),
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsBanUserModalOpen(false);
      });
  };

  const handleRemoveProfilePicture = async () => {
    if (!adminTools.selectedUsername) {
      console.error('No user selected for removing profile picture');
      return;
    }
    deleteProfilePhoto(axiosInstance, adminTools.selectedUsername)
      .then(() => {
        toast({
          title: 'Success',
          description: 'Profile picture removed successfully',
        });
      })
      .catch((error: Error) => {
        console.error('Error removing profile picture:', error);
        toast({
          title: 'Error',
          description: getServerErrorMessage(error),
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsRemoveProfilePictureModalOpen(false);
      });
  };

  useEffect(() => {
    if (!adminTools?.ready) return;
    console.log('AdminTools useEffect triggered');
    if (adminTools?.activeTool?.includes(AdminToolsEnum.BAN_USER)) {
      console.log('Opening Ban User Modal');
      setIsBanUserModalOpen(true);
    } else if (
      adminTools?.activeTool?.includes(AdminToolsEnum.REMOVE_PROFILE_PICTURE)
    ) {
      console.log('Opening Remove Profile Picture Modal');
      setIsRemoveProfilePictureModalOpen(true);
    } else {
      console.log('Closing modals');
      setIsRemoveProfilePictureModalOpen(false);
      setIsBanUserModalOpen(false);
    }
  }, [adminTools.activeTool, adminTools.ready, adminTools.selectedUsername]);

  return (
    <>
      {adminTools?.selectedUsername &&
        adminTools?.activeTool?.includes(AdminToolsEnum.BAN_USER) && (
          <BanUserModal
            isOpen={isBanUserModalOpen}
            onClose={() => setIsBanUserModalOpen(false)}
            onConfirm={banUserHandler}
            username={adminTools.selectedUsername}
          />
        )}

      {adminTools?.selectedUsername &&
        adminTools?.activeTool?.includes(
          AdminToolsEnum.REMOVE_PROFILE_PICTURE,
        ) && (
          <RemoveProfilePictureModal
            isOpen={isRemoveProfilePictureModalOpen}
            onClose={() => setIsRemoveProfilePictureModalOpen(false)}
            username={adminTools.selectedUsername}
            onRemove={() => handleRemoveProfilePicture()}
          />
        )}
    </>
  );
}
