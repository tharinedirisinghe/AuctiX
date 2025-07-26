import { useEffect, useState } from 'react';
import { set, z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, MessageSquare } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { IUser } from '@/types/IUser';
import { getUserDetails } from '@/services/adminService';
import AxiosRequest from '@/services/axiosInspector';
import { AxiosInstance } from 'axios';

// Quick message templates for common ban reasons
const quickMessages = [
  { id: 'spam', text: 'Multiple instances of spam or promotional content' },
  {
    id: 'harassment',
    text: 'Harassment or abusive behavior towards other users',
  },
  { id: 'fraud', text: 'Fraudulent activity or misrepresentation of items' },
  { id: 'terms', text: 'Violation of platform terms and conditions' },
  {
    id: 'fake',
    text: 'Creating fake listings or bidding with no intention to purchase',
  },
];

// Zod schema for form validation
const banFormSchema = z.object({
  reason: z
    .string()
    .min(10, { message: 'Ban reason must be at least 10 characters' })
    .max(500, { message: 'Ban reason cannot exceed 500 characters' }),
});

type BanFormValues = z.infer<typeof banFormSchema>;

interface BanUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: string, reason: string) => void;
  username: string;
}

export function BanUserModal({
  isOpen,
  onClose,
  onConfirm,
  username,
}: BanUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<IUser | null>(null);
  const axiosInstance: AxiosInstance = AxiosRequest().axiosInstance;

  const form = useForm<BanFormValues>({
    resolver: zodResolver(banFormSchema),
    defaultValues: {
      reason: '',
    },
  });

  useEffect(() => {
    if (!username) return;
    setIsLoading(true);
    console.log('Fetching user details for:', username);
    getUserDetails(axiosInstance, username)
      .then((data) => {
        setUser(data);
      })
      .catch((error) => {
        console.error('Error fetching user details:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [username]);

  const handleQuickMessage = (message: string) => {
    const currentReason = form.getValues('reason');
    const newReason = currentReason ? `${currentReason} ${message}` : message;
    form.setValue('reason', newReason, { shouldValidate: true });
  };

  const onSubmit = async (data: BanFormValues) => {
    if (!user) {
      console.error('No user data available');
      return;
    }
    if (user.username == null || user.email == null) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onConfirm(user.username, data.reason);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error banning user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[500px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {isLoading ? (
                // Skeleton loading state
                <div className="space-y-4">
                  <div className="flex flex-row items-center gap-4 pb-2">
                    <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>

                  <div className="h-20 bg-gray-100 rounded-md animate-pulse"></div>

                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                    <div className="h-28 bg-gray-200 rounded animate-pulse"></div>

                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="h-8 w-20 bg-gray-200 rounded animate-pulse"
                          ></div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ) : (
                // Actual content when loaded
                <>
                  <DialogHeader className="flex flex-row items-center gap-4 pb-2">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="relative">
                        <Avatar className="h-16 w-16 border-2 border-red-100">
                          <AvatarImage
                            src={user?.profile_photo}
                            alt={`${user?.firstName} ${user?.lastName}`}
                          />
                          <AvatarFallback className="text-lg bg-red-50 text-red-700">
                            {user?.profile_photo}
                          </AvatarFallback>
                        </Avatar>
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3, type: 'spring' }}
                          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                        >
                          <AlertTriangle className="h-4 w-4 text-white" />
                        </motion.div>
                      </div>
                    </motion.div>
                    <div className="flex-1">
                      <DialogTitle className="text-xl flex items-center gap-2">
                        Ban User
                        <Badge
                          variant={
                            user?.role === 'SELLER' ? 'default' : 'secondary'
                          }
                          className="ml-2"
                        >
                          {user?.role === 'SELLER' ? 'Seller' : 'Bidder'}
                        </Badge>
                      </DialogTitle>
                      <DialogDescription className="text-base font-medium mt-1">
                        {user?.firstName} {user?.lastName}
                      </DialogDescription>
                    </div>
                  </DialogHeader>

                  <div className="py-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-amber-800">
                        This action will ban the user from the platform. They
                        will no longer be able to participate in auctions or
                        sell items.
                      </p>
                    </div>

                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={form.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason for ban</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Please provide a detailed reason for banning this user..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">
                              Quick messages
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <TooltipProvider>
                              {quickMessages.map((message) => (
                                <Tooltip key={message.id}>
                                  <TooltipTrigger asChild>
                                    <motion.div
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleQuickMessage(message.text)
                                        }
                                        className="text-xs h-8"
                                      >
                                        {message.id.charAt(0).toUpperCase() +
                                          message.id.slice(1)}
                                      </Button>
                                    </motion.div>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom">
                                    <p className="max-w-[250px]">
                                      {message.text}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </TooltipProvider>
                          </div>
                        </div>

                        <DialogFooter className="pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="destructive"
                            disabled={isSubmitting}
                            className="gap-2"
                          >
                            {isSubmitting ? 'Banning...' : 'Ban User'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </div>
                </>
              )}
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
