import { AxiosInstance, isAxiosError } from 'axios';

export interface WalletInfo {
  walletId: string;
  userId: string;
  amount: number;
  freezeAmount: number;
  transactionType: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  amount: number;
  status: string;
  description: string;
  transactionDate: string;
  auction?: string;
  seller?: string;
}

export interface RechargeRequest {
  amount: number;
}

export interface WithdrawRequest {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

// DEPRECATED: Wallets are now created automatically during user registration
// This function is kept for backward compatibility and will return existing wallet info
export const createWallet = async (
  axiosInstance: AxiosInstance,
): Promise<WalletInfo> => {
  try {
    // Log the request to help with debugging
    console.log('Sending create wallet request (deprecated - wallets are auto-created)');
    const response = await axiosInstance.post('/coins/create', {});
    console.log('Create wallet response:', response.data);
    return response.data;
  } catch (error: unknown) {
    console.error('Create wallet error:', error);

    if (isAxiosError(error)) {
      throw new Error(error.response?.data || 'Failed to access wallet');
    }

    throw new Error(
      error instanceof Error ? error.message : 'Failed to access wallet',
    );
  }
};

export const getWalletInfo = async (
  axiosInstance: AxiosInstance,
): Promise<WalletInfo> => {
  try {
    const response = await axiosInstance.get('/coins/wallet-info');
    return response.data;
  } catch (error: unknown) {
    console.error('Get wallet info error:', error);

    if (isAxiosError(error)) {
      throw new Error(error.response?.data || 'Failed to fetch wallet info');
    }

    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch wallet info',
    );
  }
};

export const getTransactionHistory = async (
  axiosInstance: AxiosInstance,
): Promise<Transaction[]> => {
  try {
    const response = await axiosInstance.get('/coins/transaction-history');
    return response.data || [];
  } catch (error: unknown) {
    console.error(
      'Get transaction history error:',
      isAxiosError(error) ? error.response || error : error,
    );
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
};

export const rechargeWallet = async (
  amount: number,
  axiosInstance: AxiosInstance,
): Promise<Transaction> => {
  try {
    const response = await axiosInstance.post('/coins/recharge', { amount });
    return response.data;
  } catch (error: unknown) {
    console.error('Recharge wallet error:', error);

    if (isAxiosError(error)) {
      if (error.response) {
        throw new Error(
          error.response.data?.message ||
            error.response.data ||
            'Failed to recharge wallet',
        );
      } else if (error.request) {
        throw new Error(
          'No response received from server. Please check your network connection.',
        );
      }
    }

    throw new Error(
      error instanceof Error ? error.message : 'Failed to recharge wallet',
    );
  }
};

export const withdrawFunds = async (
  request: WithdrawRequest,
  axiosInstance: AxiosInstance,
): Promise<Transaction> => {
  try {
    const response = await axiosInstance.post('/coins/withdraw', request);

    if (!response.data) {
      throw new Error('No data received from server');
    }

    return response.data;
  } catch (error: unknown) {
    console.error('Withdraw funds error:', error);

    // Handle different types of errors with more specific messages
    if (isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorMessage =
          error.response.data?.message ||
          error.response.data ||
          `Server error: ${error.response.status}`;
        throw new Error(errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error(
          'No response received from server. Please check your network connection.',
        );
      }
    }

    // Something happened in setting up the request that triggered an Error
    throw new Error(
      error instanceof Error ? error.message : 'Failed to withdraw funds',
    );
  }
};
