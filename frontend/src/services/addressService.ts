import axiosInstance from './axiosInstance';

export interface UserAddress {
  id: string;
  addressNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddressCreateRequest {
  addressNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface AddressUpdateRequest {
  addressNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Get current user's address
export const getUserAddress = async (): Promise<UserAddress | null> => {
  try {
    const response = await axiosInstance.get('/user/address');
    return response.data;
  } catch (error) {
    if ((error as { response?: { status?: number } }).response?.status === 404) {
      return null; // User has no address
    }
    console.error('Error fetching user address:', error);
    throw error;
  }
};

// Create or update user address
export const saveUserAddress = async (
  addressData: AddressCreateRequest,
): Promise<UserAddress> => {
  try {
    console.log('Saving address data:', addressData);
    const response = await axiosInstance.post('/user/address', addressData);
    return response.data;
  } catch (error) {
    console.error('Error saving user address:', error);
    const axiosError = error as { response?: { data?: unknown; status?: number } };
    console.error('Error response:', axiosError.response?.data);
    console.error('Error status:', axiosError.response?.status);
    throw error;
  }
};

// Update user address
export const updateUserAddress = async (
  addressData: AddressUpdateRequest,
): Promise<UserAddress> => {
  try {
    const response = await axiosInstance.put('/user/address', addressData);
    return response.data;
  } catch (error) {
    console.error('Error updating user address:', error);
    throw error;
  }
};

// Delete user address
export const deleteUserAddress = async (): Promise<void> => {
  try {
    await axiosInstance.delete('/user/address');
  } catch (error) {
    console.error('Error deleting user address:', error);
    throw error;
  }
};

// Update delivery address for a specific delivery
export const updateDeliveryAddress = async (
  deliveryId: string,
  addressData: AddressCreateRequest,
  maxRetries: number = 3,
): Promise<void> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Updating delivery address for delivery: ${deliveryId} (attempt ${attempt}/${maxRetries})`);
      console.log('Address data:', addressData);
      
      // First check if user has existing address
      let existingAddress;
      try {
        existingAddress = await getUserAddress();
      } catch (error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status !== 404) {
          throw error;
        }
        // 404 means no address exists, which is fine
        existingAddress = null;
      }
      
      // Save or update user address
      if (existingAddress) {
        await updateUserAddress(addressData);
      } else {
        await saveUserAddress(addressData);
      }
      
      // Note: No need to update delivery directly as the backend 
      // automatically uses the user's address when fetching deliveries
      console.log('Successfully updated delivery address');
      return; // Success, exit retry loop
    } catch (error) {
      console.error(`Error updating delivery address (attempt ${attempt}/${maxRetries}):`, error);
      const axiosError = error as { response?: { data?: unknown; status?: number } };
      console.error('Error response:', axiosError.response?.data);
      console.error('Error status:', axiosError.response?.status);
      
      lastError = error;
      
      // Check if it's a transaction conflict that we should retry
      const errorMessage = String(axiosError.response?.data || '');
      const isTransactionConflict = errorMessage.includes('Row was updated or deleted by another transaction') ||
                                   axiosError.response?.status === 500;
      
      if (isTransactionConflict && attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If not a retryable error or max retries reached, throw the error
      break;
    }
  }
  
  throw lastError;
};