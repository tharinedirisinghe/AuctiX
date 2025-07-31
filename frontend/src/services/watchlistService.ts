import { AxiosInstance } from 'axios';

export interface WatchListAuctionItem {
  id: string;
  category: string;
  title: string;
  description: string;
  images: string[];
  sellerName: string;
  startingPrice: number;
  startTime: string;
  endTime: string;
  currentHighestBidAmount: number;
  currentHighestBidderName: string;
  bidCount: number;
  isOutbid: boolean;
  isHighestBidder: boolean;
  userBidAmount?: number | null; // User's last bid amount, can be null if not bid
}

interface GetWatchListParams {
  axiosInstance: AxiosInstance;
  sortBy?: string | null;
  order?: 'asc' | 'desc';
  limit: number;
  offset: number;
  search?: string | null;
  filterOutbid?: boolean;
  filterHighestBidder?: boolean;
  filterNoBid?: boolean;
}
export const getWatchList = async ({
  axiosInstance,
  sortBy = null,
  order = 'desc',
  limit,
  offset,
  search = null,
  filterOutbid,
  filterHighestBidder,
  filterNoBid,
}: GetWatchListParams): Promise<{
  data: WatchListAuctionItem[];
  currentPage: number;
  totalPages: number;
  size: number;
  totalElements: number;
}> => {
  try {
    const response = await axiosInstance.get('/watchlist/', {
      params: {
        sortby: sortBy,
        order: order,
        limit: limit,
        offset: offset,
        search: search,
        isOutbid: filterOutbid,
        isHighestBidder: filterHighestBidder,
        filterNoBid: filterNoBid,
      },
    });

    const raw = response.data.content || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: WatchListAuctionItem[] = raw.map((item: any) => {
      const auction = item.auction;

      return {
        id: auction.id,
        category: auction.category,
        title: auction.title,
        description: auction.description,
        images: (auction.images || []).map(getImageUrl),
        sellerName: auction.seller?.username || '',
        startingPrice: auction.startingPrice,
        startTime: auction.startTime,
        endTime: auction.endTime,
        currentHighestBidAmount: auction.currentHighestBid?.amount || 0,
        currentHighestBidderName: auction.currentHighestBid?.bidderName || '',
        bidCount: auction.bidHistory?.length || 0,
        isOutbid: item.outbid || false,
        isHighestBidder: item.highestBidder || false,
        userBidAmount: item.userBidAmount ?? null,
      };
    });

    return {
      data,
      currentPage: response.data.page.number || 0,
      totalPages: response.data.page.totalPages || 1,
      size: response.data.page.size,
      totalElements: response.data.page.totalElements,
    };
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    throw error;
  }
};

const getImageUrl = (uuid: string) => {
  return `${import.meta.env.VITE_API_URL}/auctions/getAuctionImages?file_uuid=${uuid}`;
};

export const addActionToWatchList = async (
  auctionId: string,
  axiosInstance: AxiosInstance,
) => {
  await axiosInstance.post(`/watchlist/${auctionId}`);
};

export const removeAuctionFromWatchList = async (
  auctionId: string,
  axiosInstance: AxiosInstance,
) => {
  await axiosInstance.delete(`/watchlist/${auctionId}`);
};

export const checkIfAuctionIsWatched = async (
  auctionId: string,
  axiosInstance: AxiosInstance,
) => {
  const response = await axiosInstance.get(
    `/watchlist/${auctionId}/is-watched`,
  );
  return response.data;
};
