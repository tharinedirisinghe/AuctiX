import { AxiosInstance } from 'axios';

const baseURL = import.meta.env.VITE_API_URL;

export const getSellerVerificationStatus = async (
  axiosInstance: AxiosInstance,
) => {
  const response = await axiosInstance.get('/seller/sellerVerificationStatus');
  return response.data;
};

export const submitSellerVerificationDocuments = async (
  files: File[],
  axiosInstance: AxiosInstance,
) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await axiosInstance.post(
    '/seller/submitSellerVerifications',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data;
};

export const downloadAndOpenFile = async (
  docId: string,
  axiosInstance: AxiosInstance,
) => {
  try {
    const response = await axiosInstance.post(
      `/seller/document/${docId}`,
      {},
      {
        responseType: 'blob',
      },
    );

    const contentDisposition = response.headers['content-disposition'];
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : `file-${docId}`;

    const blob = new Blob([response.data], {
      type: response.headers['content-type'],
    });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading file:', error);
  }
};
