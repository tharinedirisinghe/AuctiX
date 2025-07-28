import axiosInstance from './axiosInstance';

export interface ReviewCreateRequest {
  deliveryId: string;
  rating: number;
  reviewText: string;
}

export interface Review {
  id: string;
  deliveryId: string;
  auctionId: string;
  auctionTitle: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerRatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  recentReviews: Review[];
}

export interface PaginatedReviews {
  content: Review[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

class ReviewService {
  private readonly baseUrl = '/reviews';

  async createReview(reviewData: ReviewCreateRequest): Promise<Review> {
    const response = await axiosInstance.post(`${this.baseUrl}`, reviewData);
    return response.data;
  }

  async getReviewByDeliveryId(deliveryId: string): Promise<Review | null> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/delivery/${deliveryId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async canReviewDelivery(deliveryId: string): Promise<boolean> {
    const response = await axiosInstance.get(`${this.baseUrl}/delivery/${deliveryId}/can-review`);
    return response.data;
  }

  async getSellerReviews(sellerId: string, page: number = 0, size: number = 10): Promise<PaginatedReviews> {
    const response = await axiosInstance.get(`${this.baseUrl}/seller/${sellerId}`, {
      params: { page, size }
    });
    return response.data;
  }

  async getBuyerReviews(buyerId: string, page: number = 0, size: number = 10): Promise<PaginatedReviews> {
    const response = await axiosInstance.get(`${this.baseUrl}/buyer/${buyerId}`, {
      params: { page, size }
    });
    return response.data;
  }

  async getSellerRatingStats(sellerId: string): Promise<SellerRatingStats> {
    const response = await axiosInstance.get(`${this.baseUrl}/seller/${sellerId}/stats`);
    return response.data;
  }

  async updateReview(reviewId: string, updateData: Partial<ReviewCreateRequest>): Promise<Review> {
    const response = await axiosInstance.put(`${this.baseUrl}/${reviewId}`, updateData);
    return response.data;
  }

  async deleteReview(reviewId: string): Promise<void> {
    await axiosInstance.delete(`${this.baseUrl}/${reviewId}`);
  }

  // Methods for current user (no ID needed, uses auth context)
  async getMyReviews(page: number = 0, size: number = 10): Promise<PaginatedReviews> {
    const response = await axiosInstance.get(`${this.baseUrl}/my-reviews`, {
      params: { page, size }
    });
    return response.data;
  }

  async getMyRatingStats(): Promise<SellerRatingStats> {
    const response = await axiosInstance.get(`${this.baseUrl}/my-stats`);
    return response.data;
  }
}

export const reviewService = new ReviewService();