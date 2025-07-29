import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Delivery,
  DeliveryUpdateRequest,
  getBuyerDeliveries,
  getDeliveryById,
  getSellerDeliveries,
  updateDelivery,
  updateDeliveryDate,
  updateDeliveryStatus,
} from '@/services/deliveryService';
import { RootState } from '../store';

interface DeliveryState {
  sellerDeliveries: Delivery[];
  buyerDeliveries: Delivery[];
  selectedDelivery: Delivery | null;
  loading: boolean;
  error: string | null;
}

// Define a type for API errors
interface ApiError {
  response?: {
    data?: string;
  };
  message?: string;
}

const initialState: DeliveryState = {
  sellerDeliveries: [],
  buyerDeliveries: [],
  selectedDelivery: null,
  loading: false,
  error: null,
};

// Thunks for delivery operations
export const fetchSellerDeliveries = createAsyncThunk<
  Delivery[],
  void,
  { rejectValue: string }
>('delivery/fetchSellerDeliveries', async (_, { rejectWithValue }) => {
  try {
    return await getSellerDeliveries();
  } catch (error: unknown) {
    const apiError = error as ApiError;
    return rejectWithValue(
      apiError.response?.data ||
        apiError.message ||
        'Failed to fetch seller deliveries',
    );
  }
});

export const fetchBuyerDeliveries = createAsyncThunk<
  Delivery[],
  void,
  { rejectValue: string }
>('delivery/fetchBuyerDeliveries', async (_, { rejectWithValue }) => {
  try {
    return await getBuyerDeliveries();
  } catch (error: unknown) {
    const apiError = error as ApiError;
    return rejectWithValue(
      apiError.response?.data ||
        apiError.message ||
        'Failed to fetch buyer deliveries',
    );
  }
});

export const fetchDeliveryById = createAsyncThunk<
  Delivery,
  string,
  { rejectValue: string }
>('delivery/fetchDeliveryById', async (id, { rejectWithValue }) => {
  try {
    return await getDeliveryById(id);
  } catch (error: unknown) {
    const apiError = error as ApiError;
    return rejectWithValue(
      apiError.response?.data ||
        apiError.message ||
        `Failed to fetch delivery ${id}`,
    );
  }
});


export const updateDeliveryDetails = createAsyncThunk<
  Delivery,
  { id: string; updateData: DeliveryUpdateRequest },
  { rejectValue: string }
>(
  'delivery/updateDelivery',
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      return await updateDelivery(id, updateData);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      return rejectWithValue(
        apiError.response?.data ||
          apiError.message ||
          `Failed to update delivery ${id}`,
      );
    }
  },
);

export const updateStatus = createAsyncThunk<
  Delivery,
  { id: string; status: string },
  { rejectValue: string }
>('delivery/updateStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    return await updateDeliveryStatus(id, status);
  } catch (error: unknown) {
    const apiError = error as ApiError;
    return rejectWithValue(
      apiError.response?.data ||
        apiError.message ||
        `Failed to update delivery status`,
    );
  }
});

export const updateDate = createAsyncThunk<
  Delivery,
  { id: string; date: string },
  { rejectValue: string }
>('delivery/updateDate', async ({ id, date }, { rejectWithValue }) => {
  try {
    return await updateDeliveryDate(id, date);
  } catch (error: unknown) {
    const apiError = error as ApiError;
    return rejectWithValue(
      apiError.response?.data ||
        apiError.message ||
        `Failed to update delivery date`,
    );
  }
});

const deliverySlice = createSlice({
  name: 'delivery',
  initialState,
  reducers: {
    clearDeliveryError: (state) => {
      state.error = null;
    },
    setSelectedDelivery: (state, action: PayloadAction<Delivery | null>) => {
      state.selectedDelivery = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Seller deliveries
    builder.addCase(fetchSellerDeliveries.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchSellerDeliveries.fulfilled,
      (state, action: PayloadAction<Delivery[]>) => {
        state.loading = false;
        state.sellerDeliveries = action.payload;
      },
    );
    builder.addCase(fetchSellerDeliveries.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to fetch seller deliveries';
    });

    // Buyer deliveries
    builder.addCase(fetchBuyerDeliveries.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchBuyerDeliveries.fulfilled,
      (state, action: PayloadAction<Delivery[]>) => {
        state.loading = false;
        state.buyerDeliveries = action.payload;
      },
    );
    builder.addCase(fetchBuyerDeliveries.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to fetch buyer deliveries';
    });

    // Fetch delivery by ID
    builder.addCase(fetchDeliveryById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchDeliveryById.fulfilled,
      (state, action: PayloadAction<Delivery>) => {
        state.loading = false;
        state.selectedDelivery = action.payload;
      },
    );
    builder.addCase(fetchDeliveryById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to fetch delivery';
    });


    // Update delivery
    builder.addCase(updateDeliveryDetails.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      updateDeliveryDetails.fulfilled,
      (state, action: PayloadAction<Delivery>) => {
        state.loading = false;

        // Update in sellerDeliveries
        const sellerIndex = state.sellerDeliveries.findIndex(
          (delivery) => delivery.id === action.payload.id,
        );
        if (sellerIndex !== -1) {
          state.sellerDeliveries[sellerIndex] = action.payload;
        }

        // Update in buyerDeliveries
        const buyerIndex = state.buyerDeliveries.findIndex(
          (delivery) => delivery.id === action.payload.id,
        );
        if (buyerIndex !== -1) {
          state.buyerDeliveries[buyerIndex] = action.payload;
        }

        // Update selectedDelivery if it's the same ID
        if (state.selectedDelivery?.id === action.payload.id) {
          state.selectedDelivery = action.payload;
        }
      },
    );
    builder.addCase(updateDeliveryDetails.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to update delivery';
    });

    // Update status
    builder.addCase(updateStatus.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      updateStatus.fulfilled,
      (state, action: PayloadAction<Delivery>) => {
        state.loading = false;

        // Update in sellerDeliveries
        const sellerIndex = state.sellerDeliveries.findIndex(
          (delivery) => delivery.id === action.payload.id,
        );
        if (sellerIndex !== -1) {
          state.sellerDeliveries[sellerIndex] = action.payload;
        }

        // Update in buyerDeliveries
        const buyerIndex = state.buyerDeliveries.findIndex(
          (delivery) => delivery.id === action.payload.id,
        );
        if (buyerIndex !== -1) {
          state.buyerDeliveries[buyerIndex] = action.payload;
        }

        // Update selectedDelivery if it's the same ID
        if (state.selectedDelivery?.id === action.payload.id) {
          state.selectedDelivery = action.payload;
        }
      },
    );
    builder.addCase(updateStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to update delivery status';
    });

    // Update date
    builder.addCase(updateDate.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      updateDate.fulfilled,
      (state, action: PayloadAction<Delivery>) => {
        state.loading = false;

        // Update in sellerDeliveries
        const sellerIndex = state.sellerDeliveries.findIndex(
          (delivery) => delivery.id === action.payload.id,
        );
        if (sellerIndex !== -1) {
          state.sellerDeliveries[sellerIndex] = action.payload;
        }

        // Update in buyerDeliveries
        const buyerIndex = state.buyerDeliveries.findIndex(
          (delivery) => delivery.id === action.payload.id,
        );
        if (buyerIndex !== -1) {
          state.buyerDeliveries[buyerIndex] = action.payload;
        }

        // Update selectedDelivery if it's the same ID
        if (state.selectedDelivery?.id === action.payload.id) {
          state.selectedDelivery = action.payload;
        }
      },
    );
    builder.addCase(updateDate.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to update delivery date';
    });
  },
});

export const { clearDeliveryError, setSelectedDelivery } =
  deliverySlice.actions;

// Selectors
export const selectSellerDeliveries = (state: RootState) =>
  state.delivery.sellerDeliveries;
export const selectBuyerDeliveries = (state: RootState) =>
  state.delivery.buyerDeliveries;
export const selectSelectedDelivery = (state: RootState) =>
  state.delivery.selectedDelivery;
export const selectDeliveryLoading = (state: RootState) =>
  state.delivery.loading;
export const selectDeliveryError = (state: RootState) => state.delivery.error;

export default deliverySlice.reducer;
