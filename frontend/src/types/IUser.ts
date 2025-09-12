export interface IUser {
  username: string | null;
  email: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profile_photo: string;
  banner_photo: string;
  role?: string | null;
  bio?: string | null;
  isSuspended: boolean;
  address?: {
    addressNumber?: string;
    addressLine1?: string;
    addressLine2?: string;
    country?: string;
  };
  urls?: string[];
  isVerified: boolean;
}
