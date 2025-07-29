import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, MessageSquare } from 'lucide-react';
import { AxiosInstance } from 'axios';

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VerificationDocument } from '../organisms/VerificationSubmissionList';
import { rejectSellerVerification } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import { getServerErrorMessage } from '@/lib/errorMsg';

// Quick message templates for rejection
const quickMessages = [
  { id: 'unclear', text: 'Document image is unclear or blurry' },
  { id: 'incomplete', text: 'Required information is not visible or complete' },
  { id: 'invalid', text: 'Document type does not meet requirements' },
  { id: 'expired', text: 'Document appears to be expired' },
  { id: 'altered', text: 'Document appears to be altered or tampered with' },
];

const rejectFormSchema = z.object({
  notes: z
    .string()
    .min(10, { message: 'Rejection reason must be at least 10 characters' })
    .max(500, { message: 'Notes cannot exceed 500 characters' }),
});

type RejectFormValues = z.infer<typeof rejectFormSchema>;

interface RejectDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  document: VerificationDocument | null;
  axiosInstance: AxiosInstance;
  sellerUserName: string;
}

export function RejectDocumentModal({
  isOpen,
  onClose,
  onSuccess,
  document,
  axiosInstance,
  sellerUserName,
}: RejectDocumentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<RejectFormValues>({
    resolver: zodResolver(rejectFormSchema),
    defaultValues: {
      notes: '',
    },
  });

  const handleQuickMessage = (message: string) => {
    const currentNotes = form.getValues('notes');
    const newNotes = currentNotes ? `${currentNotes} ${message}` : message;
    form.setValue('notes', newNotes, { shouldValidate: true });
  };

  const onSubmit = async (data: RejectFormValues) => {
    if (!document) return;

    setIsSubmitting(true);
    try {
      await rejectSellerVerification(
        axiosInstance,
        sellerUserName,
        document.id,
        data.notes,
      );
      toast({
        title: 'Success',
        description: `Document "${document.docTitle}" has been rejected.`,
        variant: 'default',
      });
      form.reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast({
        title: 'Error',
        description: getServerErrorMessage(error as Error),
        variant: 'destructive',
      });
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
              <DialogHeader className="flex flex-row items-center gap-4 pb-2">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="relative">
                    <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center border-2 border-red-100">
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                  </div>
                </motion.div>
                <div className="flex-1">
                  <DialogTitle className="text-xl text-red-700">
                    Reject Document
                  </DialogTitle>
                  <DialogDescription className="text-base font-medium mt-1">
                    {document?.docTitle}
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="py-4">
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">
                    This document will be marked as rejected. The seller will
                    need to resubmit a new document.
                  </p>
                </div>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rejection Reason</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Please provide a detailed reason for rejection..."
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
                        <p className="text-sm font-medium">Quick messages</p>
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
                                <p className="max-w-[250px]">{message.text}</p>
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
                        {isSubmitting ? 'Rejecting...' : 'Reject Document'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
