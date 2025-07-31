import axios, { AxiosInstance } from 'axios';

export const requestPasswordResetCode = async (
  email: string,
  axiosInstance: AxiosInstance = axios,
): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('email', email);

    const response = await axiosInstance.post(
      '/user/passwordResetVerificationCode',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          timeout: 30000,
        },
      },
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const validateVerificationCode = async (
  email: string,
  code: string,
  axiosInstance: AxiosInstance = axios,
): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('code', code);

    const response = await axiosInstance.post(
      '/user/verifyPasswordResetCode',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string,
  axiosInstance: AxiosInstance = axios,
): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('code', code);
    formData.append('newPassword', newPassword);

    const response = await axiosInstance.post(`/user/resetPassword`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};
