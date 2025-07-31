import { assets } from '@/config/assets';
import { IUser } from '@/types/IUser';
import { AxiosInstance } from 'axios';

const baseURL = import.meta.env.VITE_API_URL;

export interface IFilteredAdminActionsLogParams {
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
  search?: string;
  actionTypeFilter?: string;
}

export const getFilteredAdminActionsLog = async (
  axiosInstance: AxiosInstance,
  params: IFilteredAdminActionsLogParams = {},
) => {
  const {
    limit = 10,
    offset = 0,
    order = 'desc',
    search = '',
    actionTypeFilter = '',
  } = params;

  const response = await axiosInstance.get(
    `/admin/getFilteredAdminActionsLog`,
    {
      params: {
        limit,
        offset,
        order,
        search,
        actionTypeFilter,
      },
    },
  );

  return response.data;
};

export const banUser = async (
  axiosInstance: AxiosInstance,
  username: string,
  reason: string,
  duration: string,
) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('reason', reason);
  formData.append('duration', duration);

  const response = await axiosInstance.post('/admin/banUser', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteProfilePhoto = async (
  axiosInstance: AxiosInstance,
  username: string,
) => {
  const response = await axiosInstance.delete('/admin/deleteUserProfilePhoto', {
    params: {
      username,
    },
  });

  return response.data;
};

export const getUserDetails = async (
  axiosInstance: AxiosInstance,
  username: string,
) => {
  const response = await axiosInstance.get(`/user/getUser`, {
    params: {
      username,
    },
  });

  // Add additional setup for user data
  const userData = {
    ...response.data,
    profile_photo: response.data.profilePicture?.id
      ? `${baseURL}/user/getUserProfilePhoto?file_uuid=${response.data.profilePicture.id}`
      : assets.default_profile_image,
    banner_photo: response.data.seller?.bannerId
      ? `${baseURL}/user/getUserBannerPhoto?file_uuid=${response.data.seller.bannerId}`
      : assets.default_banner_image,
    role: response.data?.userRole?.userRole,
  };
  delete userData.profilePicture;

  return userData as IUser;
};

export const getSellerDetails = async (
  axiosInstance: AxiosInstance,
  sellerUserName: string,
) => {
  const response = await axiosInstance.get('/user/getUser', {
    params: {
      username: sellerUserName,
    },
  });

  // Add additional setup for user data
  const userData = {
    ...response.data,
    profile_photo: response.data.profilePicture?.id
      ? `${baseURL}/user/getUserProfilePhoto?file_uuid=${response.data.profilePicture.id}`
      : assets.default_profile_image,
    banner_photo: response.data.seller?.bannerId
      ? `${baseURL}/user/getUserBannerPhoto?file_uuid=${response.data.seller.bannerId}`
      : assets.default_banner_image,
    isVerified: response.data.seller?.isVerified || false,
    role: response.data?.userRole?.userRole || 'SELLER',
  };
  delete userData.profilePicture;

  return userData as IUser;
};

export const getSellerVerifications = async (
  axiosInstance: AxiosInstance,
  sellerUserName: string,
) => {
  const response = await axiosInstance.get(
    '/admin/getSellerVerifications/view',
    {
      params: {
        sellerUserName,
      },
    },
  );

  return response.data;
};

export const approveSellerVerification = async (
  axiosInstance: AxiosInstance,
  sellerUserName: string,
  requestId: string,
  note: string,
) => {
  const response = await axiosInstance.put(
    `/admin/approveSellerVerification`,
    {},
    {
      params: {
        sellerUserName,
        requestId,
        note,
      },
    },
  );
  return response.data;
};

export const rejectSellerVerification = async (
  axiosInstance: AxiosInstance,
  sellerUserName: string,
  requestId: string,
  note: string,
) => {
  const response = await axiosInstance.put(
    `/admin/rejectSellerVerification`,
    {},
    {
      params: {
        sellerUserName,
        requestId,
        note,
      },
    },
  );
  return response.data;
};

export const updateSellerVerificationNote = async (
  axiosInstance: AxiosInstance,
  sellerUserName: string,
  requestId: string,
  note: string,
) => {
  const response = await axiosInstance.patch(
    `/admin/updateSellerVerificationNote`,
    {},
    {
      params: {
        sellerUserName,
        requestId,
        note,
      },
    },
  );
  return response.data;
};
