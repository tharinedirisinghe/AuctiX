import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, AlertTriangle } from 'lucide-react';

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
import { VerificationDocument } from '../organisms/VerificationSubmissionList';

const noteFormSchema = z.object({
  notes: z
    .string()
    .min(5, { message: 'Note must be at least 5 characters' })
    .max(500, { message: 'Note cannot exceed 500 characters' }),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (docId: string, notes: string) => void;
  document: VerificationDocument | null;
}

export function AddNoteModal({
  isOpen,
  onClose,
  onConfirm,
  document,
}: AddNoteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      notes:
        document?.description !== 'no review notes'
          ? document?.description || ''
          : '',
    },
  });

  const onSubmit = async (data: NoteFormValues) => {
    if (!document) return;

    setIsSubmitting(true);
    try {
      await onConfirm(document.docId, data.notes);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error updating note:', error);
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
                    <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center border-2 border-gray-200 hover:bg-yellow-50 hover:border-yellow-200 transition-colors">
                      <MessageSquare className="h-8 w-8 text-gray-700 hover:text-gray-800" />
                    </div>
                  </div>
                </motion.div>
                <div className="flex-1">
                  <DialogTitle className="text-xl text-gray-900">
                    Edit Review Note
                  </DialogTitle>
                  <DialogDescription className="text-base font-medium mt-1">
                    {document?.docTitle}
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="py-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    <strong>Warning:</strong> Notes added when approving or
                    rejecting will be overwritten with this note.
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
                          <FormLabel>Review Note</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add your review notes here..."
                              className="min-h-[150px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                        className="bg-brandGoldYellow hover:bg-brandGoldYellow/80 text-gray-900 gap-2"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Updating...' : 'Update Note'}
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
