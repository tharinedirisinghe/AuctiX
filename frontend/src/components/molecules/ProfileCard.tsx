import { motion } from 'framer-motion';
import type { ImageResult } from '../molecules/ImageUploadModal';
import ImageUploadPopup from '../molecules/ImageUploadModal';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Mail, AtSign, Shield } from 'lucide-react';
import { TooltipBtn } from '../atoms/TooltipBtn';
import { useMemo } from 'react';
import { assets } from '@/config/assets';

interface ProfileCardProps {
  username: string;
  email: string;
  role: string;
  profilePhoto: string;
  bannerPhoto: string;
  isProfileLoading: boolean;
  isBannerLoading: boolean;
  isInEditMode: boolean;
  onProfilePhotoSet: (e: ImageResult) => void;
  onBannerPhotoSet: (e: ImageResult) => void;
  onRemoveBanner: () => void;
  onProfilePhotoDelete: () => void;
}

export default function ProfileCard({
  username,
  email,
  role,
  profilePhoto,
  bannerPhoto,
  isProfileLoading,
  isBannerLoading,
  isInEditMode,
  onProfilePhotoSet,
  onProfilePhotoDelete,
  onBannerPhotoSet,
  onRemoveBanner,
}: ProfileCardProps) {
  const formatRole = (role: string) => {
    return role
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const editBtnVisibility = useMemo(() => {
    if (isInEditMode) {
      if (role != 'SELLER') {
        return 'hidden';
      } else {
        return 'visible';
      }
    } else {
      return 'hidden';
    }
  }, [isInEditMode, role]);

  return (
    <Card className="overflow-hidden mb-6">
      {/* Banner Section */}
      <div className="relative h-48 bg-gray-200">
        {isBannerLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <img
              src={bannerPhoto || assets.default_banner_image}
              alt="Profile Banner"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute top-4 right-4 flex space-x-2">
              <ImageUploadPopup
                minHeight={300}
                minWidth={800}
                acceptingHeight={500}
                acceptingWidth={1500}
                shape="square"
                onConfirm={onBannerPhotoSet}
                buttonClassName={editBtnVisibility}
              />
              <TooltipBtn
                icon={Trash2}
                text="Remove Banner"
                onClick={onRemoveBanner}
                className={editBtnVisibility}
              />
            </div>
          </motion.div>
        )}

        {/* Profile Photo (positioned to overlap the banner) */}
        <div className="absolute -bottom-16 left-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white">
              {isProfileLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-500"></div>
                </div>
              ) : (
                <img
                  src={profilePhoto || assets.default_profile_image}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 flex items-center gap-2">
              <TooltipBtn
                icon={Trash2}
                text="Remove Profile Photo"
                onClick={onProfilePhotoDelete}
                className={'p-2 mr-14'}
              />
              <ImageUploadPopup
                minHeight={100}
                minWidth={100}
                acceptingHeight={500}
                acceptingWidth={500}
                shape="circle"
                onConfirm={onProfilePhotoSet}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info Section */}
      <CardContent className="pt-20 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <AtSign className="w-5 h-5 text-gray-500" />
            {username}
          </h2>

          <p className="text-gray-600 flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-500" />
            {email}
          </p>

          <p className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-500" />
            <span className="px-2 py-0.5 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
              {formatRole(role)}
            </span>
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}
