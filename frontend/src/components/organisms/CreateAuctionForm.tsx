import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AxiosInstance } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import AxiosRequest from '@/services/axiosInspector';

interface AuctionUpdateFormDTO {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  startTime: string;
  endTime: string;
  isPublic?: boolean;
  category: string;
  images: string[];
  hasBids: boolean;
  canFullyEdit: boolean;
}

interface ValidationErrors {
  title?: string;
  description?: string;
  startingPrice?: string;
  startTime?: string;
  endTime?: string;
  category?: string;
  images?: string;
  [key: string]: string | undefined;
}

// Move FormField component outside of AuctionForm
const FormField = ({
  label,
  children,
  fieldName,
  required = false,
  constraint = '',
  touched,
  validationErrors,
  isEditMode,
}: {
  label: string;
  children: React.ReactNode;
  fieldName: string;
  required?: boolean;
  constraint?: string;
  touched: Record<string, boolean>;
  validationErrors: ValidationErrors;
  isEditMode: boolean;
}) => (
  <div>
    <label className="block font-medium mb-2">
      {label}
      {required && !isEditMode && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {constraint && !isEditMode && (
      <p className="text-sm text-gray-600 mt-1">{constraint}</p>
    )}
    {touched[fieldName] && validationErrors[fieldName] && (
      <p className="text-sm text-red-500 mt-1">{validationErrors[fieldName]}</p>
    )}
  </div>
);

// Add this helper function to extract error messages
const getErrorMessage = (error: any): string => {
  console.error('Full error object:', error);

  // If it's a network error
  if (!error.response) {
    return 'Network error. Please check your connection and try again.';
  }

  const { response } = error;
  const status = response.status;
  const data = response.data;

  // Handle different status codes with specific messages
  switch (status) {
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      // Check if it's the seller role error
      if (data && data.message) {
        return data.message;
      }
      return 'Access denied. You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 413:
      return 'File size too large. Please use smaller images.';
    case 422:
      return 'Validation failed. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      break;
  }

  // Try to extract message from response data
  if (data) {
    // If data is a string, return it directly
    if (typeof data === 'string') {
      return data;
    }

    // If data has a message property
    if (data.message) {
      return data.message;
    }

    // If data has an error property
    if (data.error) {
      return data.error;
    }

    // If data has errors array (for validation errors)
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.join(', ');
    }

    // If data is an object, try to stringify it meaningfully
    if (typeof data === 'object') {
      try {
        return JSON.stringify(data);
      } catch {
        return 'An error occurred but details could not be parsed.';
      }
    }
  }

  // Default fallback
  return 'Something went wrong. Please try again.';
};

const AuctionForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState<string>(''); // Changed to string for better control
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [existingImageIds, setExistingImageIds] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [canFullyEdit, setCanFullyEdit] = useState(true);
  const [hasBids, setHasBids] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const axiosInstance: AxiosInstance = AxiosRequest().axiosInstance;
  const [originalStartTime, setOriginalStartTime] = useState('');

  // Helper function to convert ISO string to human-readable format
  const formatTimestamp = (isoString: string): string => {
    try {
      const date = new Date(isoString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', isoString);
        return isoString;
      }

      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Colombo', // Adjust timezone as needed
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return isoString;
    }
  };

  // Helper function to convert ISO string to datetime-local format
  const convertToDatetimeLocal = (isoString: string): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toISOString().slice(0, 16);
    } catch (error) {
      console.error('Error converting date:', error);
      return '';
    }
  };

  // Validation functions
  const validateTitle = (value: string): string => {
    if (!value.trim()) return 'Title is required';
    const wordCount = value
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    if (wordCount < 5) return 'Title must be at least 5 words long';
    if (value.length > 100) return 'Title cannot exceed 100 characters';
    return '';
  };

  const validateDescription = (value: string): string => {
    if (!value.trim()) return 'Description is required';
    if (value.length < 20)
      return 'Description must be at least 20 characters long';
    if (value.length > 1000) return 'Description cannot exceed 1000 characters';
    return '';
  };

  const validateStartingPrice = (value: string): string => {
    if (!value || value.trim() === '') return 'Starting price is required';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'Starting price must be a valid number';
    if (numValue <= 0) return 'Starting price must be greater than 0';
    if (numValue > 10000000)
      return 'Starting price cannot exceed 10,000,000 LKR';
    // Check for reasonable decimal places (max 2)
    if (value.includes('.') && value.split('.')[1].length > 2) {
      return 'Starting price cannot have more than 2 decimal places';
    }
    return '';
  };

  const validateStartTime = (value: string): string => {
    if (!value) return 'Start time is required';

    // In edit mode, allow the original start time
    if (isEditMode && originalStartTime && value === originalStartTime) {
      return '';
    }

    const startDate = new Date(value);
    const now = new Date();
    if (startDate < now) return 'Start time must be in the future';
    return '';
  };

  const validateEndTime = (value: string, startTimeValue: string): string => {
    if (!value) return 'End time is required';
    if (!startTimeValue) return '';
    const startDate = new Date(startTimeValue);
    const endDate = new Date(value);
    if (endDate <= startDate) return 'End time must be after start time';

    const duration = endDate.getTime() - startDate.getTime();
    const minDuration = 60 * 60 * 1000; // 1 hour in milliseconds
    const maxDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

    if (duration < minDuration) {
      return 'Auction must run for at least 1 hour';
    }
    if (duration > maxDuration) {
      return 'Auction cannot run for more than 30 days';
    }
    return '';
  };

  const validateCategory = (value: string): string => {
    if (!value) return 'Category is required';
    return '';
  };

  const validateImages = (
    newImages: File[],
    existingImages: string[],
  ): string => {
    const total = newImages.length + existingImages.length;
    if (total === 0) return 'At least one image is required';
    if (total > 5) return 'Maximum 5 images allowed';

    // Check file sizes (max 5MB per image)
    for (const file of newImages) {
      if (file.size > 5 * 1024 * 1024) {
        return 'Each image must be less than 5MB';
      }
      // Check file type
      if (!file.type.startsWith('image/')) {
        return 'Only image files are allowed';
      }
      // Check specific image formats
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        return 'Only JPG, PNG, GIF, and WebP images are allowed';
      }
    }
    return '';
  };

  // Real-time validation
  const validateField = (field: string, value: any) => {
    let error = '';
    switch (field) {
      case 'title':
        error = validateTitle(value);
        break;
      case 'description':
        error = validateDescription(value);
        break;
      case 'startingPrice':
        error = validateStartingPrice(value);
        break;
      case 'startTime':
        error = validateStartTime(value);
        break;
      case 'endTime':
        error = validateEndTime(value, startTime);
        break;
      case 'category':
        error = validateCategory(value);
        break;
      case 'images':
        error = validateImages(images, existingImageIds);
        break;
    }

    setValidationErrors((prev) => ({
      ...prev,
      [field]: error,
    }));

    return error === '';
  };

  // Field blur handlers
  const handleFieldBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    if (touched.title || !isEditMode) {
      validateField('title', value);
    }
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;
    setDescription(value);
    if (touched.description || !isEditMode) {
      validateField('description', value);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty string for clearing the field
    if (value === '') {
      setStartingPrice('');
      if (touched.startingPrice || !isEditMode) {
        validateField('startingPrice', value);
      }
      return;
    }

    // Only allow numbers and decimal point
    const numericRegex = /^\d*\.?\d*$/;
    if (!numericRegex.test(value)) {
      return; // Don't update state if invalid characters
    }

    // Prevent multiple decimal points
    if ((value.match(/\./g) || []).length > 1) {
      return;
    }

    // Limit decimal places to 2
    if (value.includes('.') && value.split('.')[1].length > 2) {
      return;
    }

    setStartingPrice(value);
    if (touched.startingPrice || !isEditMode) {
      validateField('startingPrice', value);
    }
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartTime(value);
    if (touched.startTime || !isEditMode) {
      validateField('startTime', value);
    }
    // Also revalidate end time when start time changes
    if (endTime && (touched.endTime || !isEditMode)) {
      validateField('endTime', endTime);
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndTime(value);
    if (touched.endTime || !isEditMode) {
      validateField('endTime', value);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCategory(value);
    if (touched.category || !isEditMode) {
      validateField('category', value);
    }
  };

  const handlePublicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPublic(e.target.checked);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages = [...images, ...files];
      setImages(newImages);
      validateField('images', newImages);
      setTouched((prev) => ({ ...prev, images: true }));
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    validateField('images', newImages);
  };

  const removeExistingImage = (index: number) => {
    const newExistingImages = existingImageIds.filter((_, i) => i !== index);
    setExistingImageIds(newExistingImages);
    validateField('images', images); // Revalidate with new existing images count
  };

  // Updated handleSubmit function with better error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched for validation display
    setTouched({
      title: true,
      description: true,
      startingPrice: true,
      startTime: true,
      endTime: true,
      category: true,
      images: true,
    });

    // Run all validations
    const titleValid = validateField('title', title);
    const descriptionValid = validateField('description', description);
    const priceValid = validateField('startingPrice', startingPrice);
    const startTimeValid = validateField('startTime', startTime);
    const endTimeValid = validateField('endTime', endTime);
    const categoryValid = validateField('category', category);
    const imagesValid = validateField('images', images);

    if (
      !titleValid ||
      !descriptionValid ||
      !priceValid ||
      !startTimeValid ||
      !endTimeValid ||
      !categoryValid ||
      !imagesValid
    ) {
      // Scroll to first error
      const firstErrorField = document.querySelector('.border-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('startingPrice', startingPrice);
      formData.append('startTime', new Date(startTime).toISOString());
      formData.append('endTime', new Date(endTime).toISOString());
      formData.append('isPublic', isPublic.toString());
      formData.append('category', category);

      if (images.length > 0) {
        images.forEach((image) => formData.append('images', image));
      }

      // Add existing image IDs to retain them
      if (isEditMode && existingImageIds.length > 0) {
        existingImageIds.forEach((id) => formData.append('existingImages', id));
      }

      const endpoint = isEditMode
        ? `/auctions/update/${id}`
        : '/auctions/create';
      const method = isEditMode ? 'put' : 'post';

      const response = await axiosInstance.request({
        method,
        url: endpoint,
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // Increase timeout for file uploads
      });

      toast({
        title: 'Success',
        description: isEditMode
          ? 'Auction updated successfully!'
          : 'Auction created successfully!',
        variant: 'default',
      });

      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (error: any) {
      console.error('Error submitting form:', error);

      const errorMessage = getErrorMessage(error);

      // Show different toast styles based on error type
      const isValidationError = error.response?.status === 400;
      const isForbiddenError = error.response?.status === 403;
      const isAuthError = error.response?.status === 401;

      let toastTitle = 'Error';
      if (isValidationError) {
        toastTitle = 'Validation Error';
      } else if (isForbiddenError) {
        toastTitle = 'Access Denied';
      } else if (isAuthError) {
        toastTitle = 'Authentication Error';
      }

      toast({
        title: toastTitle,
        description: errorMessage,
        variant: 'destructive',
      });

      // If it's an auth error, redirect to login after a delay
      if (isAuthError) {
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Process description to format timestamps
  const processDescription = (desc: string): string => {
    // Updated regex pattern to match your exact timestamp format
    const timestampPattern =
      /\[Edited on: (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z)?)\]/g;

    return desc.replace(timestampPattern, (match, timestamp) => {
      const humanReadable = formatTimestamp(timestamp);
      return `[Edited on: ${humanReadable}]`;
    });
  };

  // Also update the useEffect error handling for loading auction data
  useEffect(() => {
    if (id && !dataLoaded) {
      setIsEditMode(true);
      setLoading(true);

      axiosInstance
        .get(`/auctions/update/${id}`, { timeout: 30000 })
        .then((res) => {
          const data: AuctionUpdateFormDTO = res.data;

          setTitle(data.title || '');
          setDescription(processDescription(data.description || ''));
          setStartingPrice(data.startingPrice?.toString() || '');

          const startTimeFormatted = convertToDatetimeLocal(data.startTime);
          setStartTime(startTimeFormatted);
          setOriginalStartTime(startTimeFormatted); // Store original start time

          setEndTime(convertToDatetimeLocal(data.endTime));
          setCategory(data.category || '');
          setExistingImageIds(data.images || []);
          setCanFullyEdit(data.canFullyEdit ?? true);
          setHasBids(data.hasBids ?? false);

          const isPublicValue =
            data.isPublic ??
            (data as any).public ??
            (data as any).is_public ??
            false;
          setIsPublic(Boolean(isPublicValue));

          setDataLoaded(true);
        })
        .catch((error) => {
          // ... existing error handling code remains the same
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, axiosInstance, navigate, dataLoaded]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading auction data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {isEditMode ? 'Update Auction' : 'Create New Auction'}
        </h1>
        {!isEditMode && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
            <strong>Note:</strong> All fields marked with{' '}
            <span className="text-red-500">*</span> are required. Please review
            the constraints for each field.
          </div>
        )}
        {isEditMode && hasBids && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <strong>Note:</strong> This auction has received bids. You can only
            update the description.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          label="Product Name"
          fieldName="title"
          required={true}
          constraint="Must be at least 5 words long and not exceed 100 characters"
          touched={touched}
          validationErrors={validationErrors}
          isEditMode={isEditMode}
        >
          <Input
            value={title}
            onChange={handleTitleChange}
            onBlur={() => handleFieldBlur('title')}
            disabled={isEditMode && !canFullyEdit}
            placeholder="Enter product name (at least 5 words)"
            className={
              touched.title && validationErrors.title ? 'border-red-500' : ''
            }
          />
        </FormField>

        <FormField
          label="Auction Category"
          fieldName="category"
          required={true}
          constraint="Select from available categories"
          touched={touched}
          validationErrors={validationErrors}
          isEditMode={isEditMode}
        >
          <select
            value={category}
            onChange={handleCategoryChange}
            onBlur={() => handleFieldBlur('category')}
            disabled={isEditMode && !canFullyEdit}
            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              touched.category && validationErrors.category
                ? 'border-red-500'
                : ''
            }`}
          >
            <option value="">Select a category</option>
            <option value="Electronics">Electronics</option>
            <option value="Computers & Tech">Computers & Tech</option>
            <option value="Fashion & Clothing">Fashion & Clothing</option>
            <option value="Home & Garden">Home & Garden</option>
            <option value="Sports & Recreation">Sports & Recreation</option>
            <option value="Books & Media">Books & Media</option>
            <option value="Toys & Games">Toys & Games</option>
            <option value="Musical Instruments">Musical Instruments</option>
            <option value="Tools & Equipment">Tools & Equipment</option>
            <option value="Collectibles & Antiques">
              Collectibles & Antiques
            </option>
            <option value="Art & Crafts">Art & Crafts</option>
            {/* <option value="Automotive">Automotive</option> */}
            <option value="Jewelry & Watches">Jewelry & Watches</option>
            <option value="Health & Beauty">Health & Beauty</option>
            <option value="Business & Industrial">Business & Industrial</option>
            <option value="Traditional Items">Traditional Items</option>
            <option value="Other">Other</option>
          </select>
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Start Time"
            fieldName="startTime"
            required={true}
            constraint="Must be in the future"
            touched={touched}
            validationErrors={validationErrors}
            isEditMode={isEditMode}
          >
            <Input
              type="datetime-local"
              value={startTime}
              onChange={handleStartTimeChange}
              onBlur={() => handleFieldBlur('startTime')}
              disabled={isEditMode && !canFullyEdit}
              className={
                touched.startTime && validationErrors.startTime
                  ? 'border-red-500'
                  : ''
              }
              style={{ colorScheme: 'light' }} // Improve calendar visibility
            />
          </FormField>

          <FormField
            label="End Time"
            fieldName="endTime"
            required={true}
            constraint="Must be after start time, minimum 1 hour, maximum 30 days duration"
            touched={touched}
            validationErrors={validationErrors}
            isEditMode={isEditMode}
          >
            <Input
              type="datetime-local"
              value={endTime}
              onChange={handleEndTimeChange}
              onBlur={() => handleFieldBlur('endTime')}
              disabled={isEditMode && !canFullyEdit}
              className={
                touched.endTime && validationErrors.endTime
                  ? 'border-red-500'
                  : ''
              }
              style={{ colorScheme: 'light' }} // Improve calendar visibility
            />
          </FormField>
        </div>

        <FormField
          label="Starting Price (LKR)"
          fieldName="startingPrice"
          required={true}
          constraint="Must be greater than 0, maximum 10,000,000 LKR, up to 2 decimal places"
          touched={touched}
          validationErrors={validationErrors}
          isEditMode={isEditMode}
        >
          <Input
            type="text"
            inputMode="decimal"
            value={startingPrice}
            onChange={handlePriceChange}
            onBlur={() => handleFieldBlur('startingPrice')}
            disabled={isEditMode && !canFullyEdit}
            placeholder="Enter starting price (e.g., 1000.50)"
            className={
              touched.startingPrice && validationErrors.startingPrice
                ? 'border-red-500'
                : ''
            }
          />
        </FormField>

        <FormField
          label="Images"
          fieldName="images"
          required={true}
          constraint="1-5 images required, each under 5MB, supported formats: JPG, PNG, GIF, WebP. First image will be the main display image."
          touched={touched}
          validationErrors={validationErrors}
          isEditMode={isEditMode}
        >
          <input
            type="file"
            multiple
            onChange={handleImageUpload}
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            disabled={isEditMode && !canFullyEdit}
            className="w-full p-2 border rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-sm text-gray-500 mt-1">
            Current: {existingImageIds.length + images.length}/5 images
            {(existingImageIds.length > 0 || images.length > 0) && (
              <span className="ml-2 text-blue-600 font-medium">
                (First image will be the main display)
              </span>
            )}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {existingImageIds.map((id, idx) => (
              <div key={`existing-${idx}`} className="relative">
                <img
                  src={`http://localhost:8080/api/auctions/getAuctionImages?file_uuid=${id}`}
                  alt={`existing-${idx}`}
                  className="w-20 h-20 object-cover rounded-md border"
                />
                <span className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-1 rounded">
                  {idx === 0 ? 'Main' : 'Existing'}
                </span>
                {canFullyEdit && (
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    onClick={() => removeExistingImage(idx)}
                    title="Remove existing image"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {images.map((file, idx) => {
              const isMainImage = existingImageIds.length === 0 && idx === 0;
              return (
                <div key={`upload-${idx}`} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`preview-${idx}`}
                    className="w-20 h-20 object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    onClick={() => removeImage(idx)}
                    title="Remove new image"
                  >
                    ×
                  </button>
                  <span className="absolute top-0 left-0 bg-green-500 text-white text-xs px-1 rounded">
                    {isMainImage ? 'Main' : 'New'}
                  </span>
                </div>
              );
            })}
          </div>
        </FormField>

        <FormField
          label="Description"
          fieldName="description"
          required={true}
          constraint="Must be 20-1000 characters long. Provide detailed information about the item."
          touched={touched}
          validationErrors={validationErrors}
          isEditMode={isEditMode}
        >
          <textarea
            value={processDescription(description)} // Apply processing here
            onChange={handleDescriptionChange}
            onBlur={() => handleFieldBlur('description')}
            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical ${
              touched.description && validationErrors.description
                ? 'border-red-500'
                : ''
            }`}
            rows={5}
            placeholder="Enter detailed description including condition, features, dimensions, etc. (minimum 20 characters)"
            maxLength={1000}
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>
              Characters: {processDescription(description).length}/1000
            </span>
            {isEditMode && hasBids && (
              <span className="text-amber-600">
                Note: Updated descriptions will include a timestamp
              </span>
            )}
          </div>
        </FormField>

        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={handlePublicChange}
            disabled={isEditMode && !canFullyEdit}
            className="w-4 h-4 mt-0.5"
          />
          <label htmlFor="isPublic" className="font-medium">
            <span>Make this auction public</span>
            {!isEditMode && (
              <p className="text-sm text-gray-600 font-normal mt-1">
                Public auctions are visible to all users and can be found in
                searches. Private auctions are only visible to invited users.
              </p>
            )}
            {isEditMode && !canFullyEdit && (
              <p className="text-sm text-gray-500 font-normal mt-1">
                Visibility cannot be changed after bids are placed
              </p>
            )}
          </label>
        </div>

        <div className="flex space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              navigate(-1);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Submitting...'
              : isEditMode
                ? 'Update Auction'
                : 'Create Auction'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AuctionForm;
