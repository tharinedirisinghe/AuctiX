import { IUser } from '@/types/IUser';
import { AxiosInstance } from 'axios';

export interface IProfileUpdateData {
  bio: string;
  urls: string[];
  firstName: string;
  lastName: string;
  address: {
    addressNumber: string;
    addressLine1: string;
    addressLine2: string;
    country: string;
  };
}

export const updateProfileInfo = async (
  profileData: IProfileUpdateData,
  axiosInstance: AxiosInstance,
) => {
  const response = await axiosInstance.post(`/user/updateProfile`, profileData);
  return response.data;
};

export const updateProfilePhoto = async (
  file: File,
  axiosInstance: AxiosInstance,
) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post(
    `/user/uploadUserProfilePhoto`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data;
};

export const uploadVerificationDocs = async (
  files: File[],
  axiosInstance: AxiosInstance,
) => {
  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append('files', file);
  });

  const response = await axiosInstance.post(
    `/user/uploadVerificationDocs`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data;
};

export const deleteProfilePhoto = async (
  username: string,
  axiosInstance: AxiosInstance,
) => {
  const response = await axiosInstance.delete(`/user/deleteUserProfilePhoto`, {
    params: {
      username,
    },
  });
  return response.data;
};

export const updateBannerPhoto = async (
  file: File,
  axiosInstance: AxiosInstance,
) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post(
    `/user/uploadUserBannerPhoto`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data;
};

export const deleteBannerPhoto = async (
  username: string,
  axiosInstance: AxiosInstance,
) => {
  const response = await axiosInstance.delete(`/user/deleteBannerPhoto`, {
    params: {
      username,
    },
  });
  return response.data;
};

export interface IChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export const changePassword = async (
  passwordData: IChangePasswordData,
  axiosInstance: AxiosInstance,
) => {
  const formData = new FormData();
  formData.append('oldPassword', passwordData.oldPassword);
  formData.append('newPassword', passwordData.newPassword);

  const response = await axiosInstance.post(`/user/changePassword`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export interface IUserStats {
  totalUsers: number;
  bidders: number;
  sellers: number;
  admins: number;
}

export const getUserStats = async (
  axiosInstance: AxiosInstance,
): Promise<IUserStats> => {
  const response = await axiosInstance.get(`/user/userStats`);
  return response.data;
};
