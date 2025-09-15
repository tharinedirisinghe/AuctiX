import React, { useEffect, useState } from 'react';
import { RemoveProfilePictureModal } from './RemoveProfilePictureModal';
import { BanUserModal } from '../molecules/BanUserModal';
import AxiosRequest from '@/services/axiosInspector';
import { getServerErrorMessage, SectionEnum } from '@/lib/errorMsg';
import { banUser, deleteProfilePhoto } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { useDispatch } from 'react-redux';
import { closeTool } from '@/store/slices/adminToolsSlice';

export enum AdminToolsEnum {
  BAN_USER = 'banUser',
  REMOVE_PROFILE_PICTURE = 'removeProfilePicture',
}

export default function AdminTools() {
  const axiosInstance = AxiosRequest().axiosInstance;
  const { toast } = useToast();
  const adminTools = useAppSelector((state) => state.adminTools);
  const dispatch = useDispatch();

  const banUserHandler = (reason: string, duration: string) => {
    console.log(
      'Banning user:',
      adminTools?.selectedUsername,
      'Reason:',
      reason,
      duration,
    );
    if (!adminTools?.selectedUsername) {
      console.error('No user selected for banning');
      return;
    }
    banUser(axiosInstance, adminTools.selectedUsername, reason, duration)
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
          description: getServerErrorMessage(error, SectionEnum.DEFAULT),
          variant: 'destructive',
        });
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
          description: getServerErrorMessage(error, SectionEnum.DEFAULT),
          variant: 'destructive',
        });
      });
  };

  return (
    <>
      {adminTools?.selectedUsername && (
        <BanUserModal
          isOpen={
            adminTools.activeTool === AdminToolsEnum.BAN_USER &&
            adminTools.ready
          }
          onClose={() => dispatch(closeTool())}
          onConfirm={banUserHandler}
          username={adminTools.selectedUsername}
        />
      )}

      {adminTools?.selectedUsername && (
        <RemoveProfilePictureModal
          isOpen={
            adminTools.activeTool === AdminToolsEnum.REMOVE_PROFILE_PICTURE &&
            adminTools.ready
          }
          onClose={() => dispatch(closeTool())}
          username={adminTools.selectedUsername}
          onRemove={() => handleRemoveProfilePicture()}
        />
      )}
    </>
  );
}
