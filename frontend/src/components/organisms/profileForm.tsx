import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ImageResult } from '../molecules/ImageUploadModal';
import {
  deleteBannerPhoto,
  deleteProfilePhoto,
  IProfileUpdateData,
  updateBannerPhoto,
  updateProfileInfo,
  updateProfilePhoto,
} from '@/services/userService';
import { AxiosInstance } from 'axios';
import AxiosRequest from '@/services/axiosInspector';
import { fetchCurrentUser } from '@/store/slices/userSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { useToast } from '@/hooks/use-toast';
import { AlertBox } from './AlertBox';
import ProfileCard from '../molecules/ProfileCard';
import { ProfileUrlsSection } from '../molecules/ProfileURLsSection';
import { AddressSection } from '../molecules/ProfileAddressSection';
import { PersonalBasicInfoSection } from '../molecules/ProfileBasicInfoSection';
import { assets } from '@/config/assets';
import { IUser } from '@/types/IUser';
import { fetchPendingRequiredActions } from '@/store/slices/requiredActionsSlice';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const profileFormSchema = z.object({
  firstName: z
    .string()
    .min(3, {
      message: 'First name must be at least 3 characters.',
    })
    .max(30, {
      message: 'First name must not be longer than 30 characters.',
    }),
  lastName: z
    .string()
    .min(3, {
      message: 'Last name must be at least 3 characters.',
    })
    .max(30, {
      message: 'Last name must not be longer than 30 characters.',
    }),
  bio: z
    .string()
    .max(160, {
      message: 'Bio must not be longer than 160 characters.',
    })
    .min(4, {
      message: 'Bio must be at least 4 characters.',
    }),
  address: z.object({
    addressNumber: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    country: z.string().optional(),
  }),
  urls: z
    .array(
      z.object({
        value: z.string().min(1, { message: 'URL cannot be empty.' }).url({
          message: 'Please enter a valid URL including http:// or https://.',
        }),
        timestamp: z.number().optional(),
      }),
    )
    .min(0)
    .optional()
    .superRefine((urls, ctx) => {
      if (urls) {
        const urlValues = urls.map((u) => u.value.toLowerCase());
        const duplicates = urlValues.filter(
          (item, index) => urlValues.indexOf(item) !== index,
        );

        if (duplicates.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Duplicate URLs are not allowed',
            path: [],
          });
        }
      }
    }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const defaultValues: Partial<ProfileFormValues> = {
  firstName: '',
  lastName: '',
  bio: '',
  address: {
    addressNumber: '',
    addressLine1: '',
    addressLine2: '',
    country: '',
  },
  urls: [],
};

export function ProfileForm() {
  const [croppedImg, setCroppedImg] = useState<string | null>(null);
  const [bannerImg, setBannerImg] = useState<string>(
    assets.default_banner_image,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isProfilePictureLoading, setIsProfilePictureLoading] = useState(false);
  const [isBannerLoading, setIsBannerLoading] = useState(false);

  const { toast } = useToast();
  const axiosInstance: AxiosInstance = AxiosRequest().axiosInstance;
  const dispatch = useAppDispatch();
  const userData = useAppSelector<IUser>((state) => state.user);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    const values = {
      ...defaultValues,
    };
    form.reset(values);
  }, [form]);

  useEffect(() => {
    const values: ProfileFormValues = {
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      bio: userData.bio || '',
      address: {
        addressNumber: userData.address?.addressNumber || '',
        addressLine1: userData.address?.addressLine1 || '',
        addressLine2: userData.address?.addressLine2 || '',
        country: userData.address?.country || '',
      },
      urls: [],
    };

    if ('bio' in userData && typeof userData.bio === 'string') {
      values.bio = userData.bio;
    }

    if ('address' in userData && userData.address) {
      const address = userData.address as any;
      if (address.addressNumber)
        values.address.addressNumber = address.addressNumber;
      if (address.addressLine1)
        values.address.addressLine1 = address.addressLine1;
      if (address.addressLine2)
        values.address.addressLine2 = address.addressLine2;
      if (address.country) values.address.country = address.country;
    }

    if ('urls' in userData && Array.isArray(userData.urls)) {
      values.urls = (userData.urls as any[]).map((url) => ({
        value: url.value || '',
        timestamp: url.timestamp || Date.now(),
      }));
    }

    form.reset(values);
    setCroppedImg(userData.profile_photo || null);
    setBannerImg(userData.banner_photo || assets.default_banner_image);
  }, [userData, form]);

  function onSubmit(_data: ProfileFormValues) {
    setIsAlertOpen(true);
  }

  const onProfilePhotoSet = useCallback(
    (e: ImageResult) => {
      if (e.croppedImageBase64 != undefined && e.croppedImageFile) {
        setCroppedImg(e.croppedImageBase64);
        setIsProfilePictureLoading(true);
        updateProfilePhoto(e.croppedImageFile, axiosInstance)
          .then(() => {
            toast({
              title: 'Profile picture uploaded successfully.',
              description: 'Your profile picture has been updated.',
            });
            dispatch(fetchCurrentUser());
          })
          .finally(() => {
            setIsProfilePictureLoading(false);
          })
          .catch(() => {
            toast({
              variant: 'destructive',
              title: 'Profile picture not uploaded.',
              description: 'There was an error uploading your profile picture.',
            });
          });
      }
    },
    [axiosInstance, dispatch, toast],
  );

  const onBannerPhotoSet = useCallback(
    (e: ImageResult) => {
      if (e.croppedImageBase64 != undefined && e.croppedImageFile) {
        setBannerImg(e.croppedImageBase64);
        setIsBannerLoading(true);
        updateBannerPhoto(e.croppedImageFile, axiosInstance)
          .then(() => {
            dispatch(fetchCurrentUser());
          })
          .finally(() => {
            setIsBannerLoading(false);
          })
          .catch((error) => {
            toast({
              variant: 'destructive',
              title: 'Banner not uploaded.',
              description: 'Failed to upload banner image. Please try again.',
            });
            console.error('Banner image not uploaded.', error);
          });
      }
    },
    [axiosInstance, dispatch, toast],
  );

  const onRemoveBanner = () => {
    setIsBannerLoading(true);
    setBannerImg(assets.default_banner_image);
    deleteBannerPhoto(userData.username || '', axiosInstance)
      .then(() => {
        toast({
          title: 'Banner image deleted successfully.',
          description: 'Your banner image has been removed.',
        });
        dispatch(fetchCurrentUser());
      })
      .catch((error) => {
        toast({
          variant: 'destructive',
          title: 'Banner not deleted.',
          description: 'Failed to delete banner image. Please try again.',
        });
        console.error('Banner image not deleted.', error);
      })
      .finally(() => {
        setIsBannerLoading(false);
      });
  };

  const onProfilePhotoDelete = useCallback(() => {
    setCroppedImg(null);
    setIsProfilePictureLoading(false);
    deleteProfilePhoto(
      userData.username ? userData.username : '',
      axiosInstance,
    )
      .then(() => {
        toast({
          title: 'Profile picture deleted successfully.',
          description: 'Your profile picture has been removed.',
        });
        dispatch(fetchCurrentUser());
      })
      .catch(() => {
        toast({
          variant: 'destructive',
          title: 'Profile picture not deleted.',
          description: 'There was an error deleting your profile picture.',
        });
      });
  }, [axiosInstance, dispatch, toast, userData.username]);

  const handleSubmit = () => {
    setIsSubmitting(true);
    const formData = form.getValues();

    const profileData: IProfileUpdateData = {
      bio: formData.bio,
      firstName: formData.firstName,
      lastName: formData.lastName,
      urls:
        formData.urls
          ?.filter((url) => url.value.trim() !== '')
          .map((url) => url.value) || [],
      address: {
        addressNumber: formData.address.addressNumber || '',
        addressLine1: formData.address.addressLine1 || '',
        addressLine2: formData.address.addressLine2 || '',
        country: formData.address.country || '',
      },
    };

    updateProfileInfo(profileData, axiosInstance)
      .then(() => {
        toast({
          title: 'Profile updated successfully',
          description: 'Your profile details have been updated.',
        });
        dispatch(fetchPendingRequiredActions());
      })
      .catch((err) => {
        console.error('Error updating profile details:', err);
        toast({
          variant: 'destructive',
          title: 'Profile update failed',
          description: 'There was an error updating your profile details.',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
        setIsAlertOpen(false);
      });
  };

  return (
    <div className="py-6 max-w-6xl mx-auto">
      {/* Update profile alert */}
      <AlertBox
        onAlertOpenChange={(e) => setIsAlertOpen(e)}
        IconElement={<CheckCircle2 />}
        alertOpen={isAlertOpen}
        continueAction={handleSubmit}
        title="Confirm Profile Update"
        message="Are you sure you want to update your profile information?"
        continueBtn="Confirm"
        cancelBtn="Cancel"
      />

      {/* Profile Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          My Profile
          {isSubmitting && (
            <Badge className="bg-brandGoldYellow text-gray-900">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </Badge>
          )}
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your profile information and settings
        </p>
      </div>

      {/* Profile Card */}
      <ProfileCard
        username={userData.username || ''}
        email={userData.email || ''}
        role={userData.role || ''}
        profilePhoto={croppedImg || assets.default_profile_image}
        bannerPhoto={bannerImg}
        isProfileLoading={isProfilePictureLoading}
        isBannerLoading={isBannerLoading}
        onProfilePhotoSet={onProfilePhotoSet}
        onProfilePhotoDelete={onProfilePhotoDelete}
        onBannerPhotoSet={onBannerPhotoSet}
        onRemoveBanner={onRemoveBanner}
        isInEditMode={true}
      />

      {/* Profile Form */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <motion.form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Personal Information Section */}
              <div className="space-y-6 pt-12">
                <div>
                  <h3 className="text-lg font-medium text-gray-500">
                    Personal Information
                  </h3>
                  <Separator className="my-4 border-gray-200 border-t-2" />
                </div>
                <div className="p-6 rounded-lg border-l-2 border-yellow-500 bg-gray-50">
                  <PersonalBasicInfoSection form={form} />
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-6 pt-12">
                <div>
                  <h3 className="text-lg font-medium text-gray-500">
                    Address Details
                  </h3>
                  <Separator className="my-4 border-gray-200 border-t-2" />
                </div>
                <div className="bg-gray-50 p-6 rounded-lg border-l-2 border-yellow-500 bg-gray-50">
                  <AddressSection form={form} />
                </div>
              </div>

              {/* URLs Section */}
              <div className="space-y-6 pt-12">
                <div>
                  <h3 className="text-lg font-medium text-gray-500">
                    Online Presence
                  </h3>
                  <Separator className="my-4 border-gray-200 border-t-2" />
                </div>
                <div className="bg-gray-50 p-6 rounded-lg border-l-2 border-yellow-500">
                  <FormField
                    control={form.control}
                    name="urls"
                    render={({ fieldState }) => (
                      <FormItem>
                        <ProfileUrlsSection form={form} name="urls" />
                        {fieldState.error && (
                          <FormMessage>
                            {fieldState.error.message ||
                              'Please check your URLs for errors.'}
                          </FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <Button
                  type="submit"
                  className="bg-brandGoldYellow hover:bg-brandGoldYellow/80 text-gray-900"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </Button>
              </div>
            </motion.form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
