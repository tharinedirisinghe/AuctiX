import axiosInstance from './axiosInstance';

export interface Delivery {
  id: string;
  auctionId: string;
  auctionTitle: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  deliveryDate: string;
  status: 'PACKING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  deliveryAddress: string;
  notes: string;
  amount: number;
  trackingNumber: string;
  addressRequested?: boolean;
  createdAt: string;
  updatedAt: string;
  buyerLocation?: string;
  auctionImage?: string;
  auctionCategory?: string;
}

export interface DeliveryCreateRequest {
  auctionId: string;
  buyerId: string;
  deliveryDate: string;
  deliveryAddress: string;
  notes?: string;
}

export interface DeliveryUpdateRequest {
  deliveryDate?: string;
  status?: string;
  deliveryAddress?: string;
  notes?: string;
  trackingNumber?: string;
}

// Get all deliveries (used by admins)
export const getAllDeliveries = async (): Promise<Delivery[]> => {
  try {
    const response = await axiosInstance.get('/deliveries');
    return response.data;
  } catch (error) {
    console.error('Error fetching all deliveries:', error);
    throw error;
  }
};

// Get deliveries for the current seller
export const getSellerDeliveries = async (): Promise<Delivery[]> => {
  try {
    const response = await axiosInstance.get('/deliveries/seller');
    return response.data;
  } catch (error) {
    console.error('Error fetching seller deliveries:', error);
    throw error;
  }
};

// Get deliveries for the current buyer
export const getBuyerDeliveries = async (): Promise<Delivery[]> => {
  try {
    const response = await axiosInstance.get('/deliveries/buyer');
    return response.data;
  } catch (error) {
    console.error('Error fetching buyer deliveries:', error);
    throw error;
  }
};

// Get a specific delivery by ID
export const getDeliveryById = async (id: string): Promise<Delivery> => {
  try {
    const response = await axiosInstance.get(`/deliveries/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching delivery ${id}:`, error);
    throw error;
  }
};

// Create a new delivery
export const createDelivery = async (
  deliveryData: DeliveryCreateRequest,
): Promise<Delivery> => {
  try {
    const response = await axiosInstance.post('/deliveries', deliveryData);
    return response.data;
  } catch (error) {
    console.error('Error creating delivery:', error);
    throw error;
  }
};

// Update delivery details
export const updateDelivery = async (
  id: string,
  updateData: DeliveryUpdateRequest,
): Promise<Delivery> => {
  try {
    const response = await axiosInstance.put(`/deliveries/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Error updating delivery ${id}:`, error);
    throw error;
  }
};

// Update delivery status only
export const updateDeliveryStatus = async (
  id: string,
  status: string,
): Promise<Delivery> => {
  try {
    const response = await axiosInstance.post(
      `/deliveries/${id}/status?status=${status}`,
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating delivery ${id} status:`, error);
    throw error;
  }
};

// Update delivery date only
export const updateDeliveryDate = async (
  id: string,
  date: string,
): Promise<Delivery> => {
  try {
    const response = await axiosInstance.post(
      `/deliveries/${id}/date?deliveryDate=${date}`,
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating delivery ${id} date:`, error);
    throw error;
  }
};

// Delete a delivery
export const deleteDelivery = async (id: string): Promise<void> => {
  try {
    await axiosInstance.delete(`/deliveries/${id}`);
  } catch (error) {
    console.error(`Error deleting delivery ${id}:`, error);
    throw error;
  }
};

// Request address from buyer
export const requestDeliveryAddress = async (id: string): Promise<Delivery> => {
  try {
    const response = await axiosInstance.post(`/deliveries/${id}/request-address`);
    return response.data;
  } catch (error) {
    console.error(`Error requesting address for delivery ${id}:`, error);
    throw error;
  }
};
