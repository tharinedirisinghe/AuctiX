import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  ZoomIn,
  ZoomOut,
  BanIcon,
  RefreshCcwDot,
  LucideDelete,
  Camera,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertBox } from '../organisms/AlertBox';
import { TooltipBtn } from '../atoms/TooltipBtn';

interface Position {
  x: number;
  y: number;
}

export interface ImageResult {
  imageData: string | null;
  croppedImageBase64?: string | null;
  croppedImageFile: File;
  position: Position;
  scale: number;
}

interface ImageUploadPopupProps {
  onConfirm?: (result: ImageResult) => void;
  minWidth?: number;
  minHeight?: number;
  shape?: 'square' | 'circle';
  acceptingWidth?: number;
  acceptingHeight?: number;
  buttonClassName?: string;
}

export default function ImageUploadPopup({
  onConfirm,
  minWidth = 200,
  minHeight = 200,
  shape = 'square',
  acceptingWidth = 200,
  acceptingHeight = 200,
  buttonClassName = '',
}: ImageUploadPopupProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [image, setImage] = useState<string | null>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const positionRef = useRef<Position>(position);
  const [scale, setScale] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [autoScale, setAutoScale] = useState<number>(1);
  const [alertOpen, setAlertOpen] = useState<boolean>(false);
  const [globalScale, setGlobalScale] = useState<number>(1);
  const [fileName, setFileName] = useState<string>('profilePhoto');

  const handleOpenDialog = (): void => setIsOpen(true);

  const handleCloseDialog = (): void => {
    setIsOpen(false);
    setImage(null);
    setPosition({ x: 0, y: 0 });
    setScale(1);
    setImageError(null);
    setImageDimensions(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.match('image.*')) {
        handleFileSelect(file);
      }
    }
  };

  const validateImage = (img: HTMLImageElement): boolean => {
    if (img.naturalWidth < minWidth || img.naturalHeight < minHeight) {
      setImageError(
        `Image must be at least ${minWidth}x${minHeight} pixels. Current size: ${img.naturalWidth}x${img.naturalHeight}`,
      );
      setAlertOpen(true);
      return false;
    }
    setImageError(null);
    return true;
  };

  const calculateInitialScale = (
    imgWidth: number,
    imgHeight: number,
    containerWidth: number,
    containerHeight: number,
  ): number => {
    // Calculate the ratio for both width and height to fit inside the accepting area
    const widthRatio = acceptingWidth / imgWidth;
    const heightRatio = acceptingHeight / imgHeight;

    // Take the larger ratio to ensure the image fills the highlighted area
    // This is different from the previous approach where we took the smaller ratio
    const fillRatio = Math.max(widthRatio, heightRatio);

    // Also consider the container size to avoid images being too large for the container
    const containerWidthRatio = (containerWidth * 0.9) / imgWidth; // Use 90% of container width
    const containerHeightRatio = (containerHeight * 0.9) / imgHeight; // Use 90% of container height
    const containerFitRatio = Math.min(
      containerWidthRatio,
      containerHeightRatio,
    );

    // Choose the appropriate scale based on image size
    if (imgWidth < acceptingWidth || imgHeight < acceptingHeight) {
      // For small images, use fillRatio to make them fill the highlighted area
      // but cap at containerFitRatio to avoid exceeding container bounds
      return Math.min(fillRatio, containerFitRatio);
    } else {
      // For larger images, just ensure they're large enough to cover the highlighted area
      // but not so large they exceed container bounds
      return Math.min(Math.max(1.0, fillRatio), containerFitRatio);
    }
  };

  const centerImageInContainer = () => {
    if (imgContainerRef.current && imageDimensions) {
      // Center position is 0,0 for the transform
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleFileSelect = (file: File): void => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        const img = new Image();
        img.onload = () => {
          if (validateImage(img)) {
            setImage(e.target?.result as string);
            setImageDimensions({
              width: img.naturalWidth,
              height: img.naturalHeight,
            });

            // Wait for the next render cycle to ensure imgContainerRef is populated
            setTimeout(() => {
              if (imgContainerRef.current) {
                const containerWidth = imgContainerRef.current.clientWidth;
                const containerHeight = imgContainerRef.current.clientHeight;
                const initialScale = calculateInitialScale(
                  img.naturalWidth,
                  img.naturalHeight,
                  containerWidth,
                  containerHeight,
                );

                setAutoScale(initialScale);
                setScale(initialScale);
                // Set initial position to center
                setPosition({ x: 0, y: 0 });
              }
            }, 0);
          } else {
            // Reset the file input to allow selecting a new file
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        };
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  // Update position and scale when container or image dimensions change
  useEffect(() => {
    if (imageDimensions && imgContainerRef.current) {
      const containerWidth = imgContainerRef.current.clientWidth;
      const containerHeight = imgContainerRef.current.clientHeight;
      const newScale = calculateInitialScale(
        imageDimensions.width,
        imageDimensions.height,
        containerWidth,
        containerHeight,
      );

      // Only update if significantly different to avoid infinite loops
      if (Math.abs(newScale - autoScale) > 0.01) {
        setAutoScale(newScale);
        setScale(newScale);
        // Center the image when scale changes
        centerImageInContainer();
      }
    }
  }, [imageDimensions, acceptingWidth, acceptingHeight]);

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleButtonClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleZoomIn = (): void => {
    if (scale < 4) {
      setScale((prevScale) => {
        const newScale = prevScale + 0.1;
        // Adjust position to keep the highlighted area visible
        constrainPositionAfterZoom(newScale);
        return newScale;
      });
    }
  };

  const handleZoomOut = (): void => {
    if (scale > 0.2) {
      setScale((prevScale) => {
        const newScale = Math.max(prevScale - 0.1, 0.2);
        // Adjust position to keep the highlighted area visible
        constrainPositionAfterZoom(newScale);
        return newScale;
      });
    }
  };

  const handleResetZoom = (): void => {
    // Use the autoScale calculated based on image and container dimensions
    setScale(autoScale);
    // Reset position to center
    setPosition({ x: 0, y: 0 });
    positionRef.current = { x: 0, y: 0 };
  };

  const handleRemoveImage = (): void => {
    setImage(null);
    setPosition({ x: 0, y: 0 });
    setScale(1);
    setImageError(null);
    setImageDimensions(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Adjust position after zoom to keep the highlighted area visible
  const constrainPositionAfterZoom = (newScale: number) => {
    if (!imageDimensions) return;

    const newPos = { ...position };
    const constrainedPos = constrainPosition(newPos, newScale);
    setPosition(constrainedPos);
    positionRef.current = constrainedPos;
  };

  // Ensure image stays within the highlighted area boundaries
  const constrainPosition = (
    newPos: Position,
    currentScale: number = scale,
  ): Position => {
    if (!imgContainerRef.current || !imageDimensions) {
      return newPos;
    }

    // Calculate bounds based on scaled image size
    const scaledImageWidth = imageDimensions.width * currentScale;
    const scaledImageHeight = imageDimensions.height * currentScale;

    // Calculate the maximum allowed movement to keep the highlighted area visible
    // Apply global scale to properly constrain within the visible highlighted area
    const halfAcceptingWidth = (acceptingWidth * globalScale) / 2;
    const halfAcceptingHeight = (acceptingHeight * globalScale) / 2;

    const maxX = Math.max(scaledImageWidth / 2 - halfAcceptingWidth, 0);
    const maxY = Math.max(scaledImageHeight / 2 - halfAcceptingHeight, 0);

    return {
      // maxX and maxY will only be positive if the image is larger than the highlighted area
      // Otherwise, the image will be centered in the highlighted area
      // insider min function keep the maximum bounds not more than maxX or maxY
      // and outer max function keep the minimum bounds not less than -maxX or -maxY
      x: Math.max(Math.min(newPos.x, maxX), -maxX),
      y: Math.max(Math.min(newPos.y, maxY), -maxY),
    };
  };

  const handleDragging = (
    e: Event,
    info: { offset: { x: number; y: number } },
  ) => {
    e.preventDefault();
    const movingFactor = 1 / (scale * 1000);

    // Calculate new position
    const newPosition = {
      x: positionRef.current.x + info.offset.x * movingFactor,
      y: positionRef.current.y + info.offset.y * movingFactor,
    };

    // Constrain the position
    const constrainedPosition = constrainPosition(newPosition);

    setPosition(constrainedPosition);
    positionRef.current = constrainedPosition;
  };

  // Update positionRef when position changes
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Function to crop the image to the highlighted area
  const cropImage = (): string | null => {
    if (!image || !imageDimensions) return null;

    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Set canvas size to the accepting area dimensions (the actual requested size)
      canvas.width = acceptingWidth;
      canvas.height = acceptingHeight;

      // Create an image element to draw from
      const img = new Image();
      img.src = image;

      // Calculate the actual visible area in the image based on global scale
      // We need to account for both the user-applied scale and the container's global scale
      const visibleHighlightedWidth = acceptingWidth * globalScale;
      const visibleHighlightedHeight = acceptingHeight * globalScale;

      // Calculate source coordinates (the area of the original image to crop)
      const sourceX =
        ((imageDimensions.width * scale) / 2 -
          position.x -
          visibleHighlightedWidth / 2) /
        scale;
      const sourceY =
        ((imageDimensions.height * scale) / 2 -
          position.y -
          visibleHighlightedHeight / 2) /
        scale;
      const sourceWidth = visibleHighlightedWidth / scale;
      const sourceHeight = visibleHighlightedHeight / scale;

      // Ensure we don't try to sample outside the image bounds
      const clampedSourceX = Math.max(
        0,
        Math.min(sourceX, imageDimensions.width - sourceWidth),
      );
      const clampedSourceY = Math.max(
        0,
        Math.min(sourceY, imageDimensions.height - sourceHeight),
      );
      const clampedSourceWidth = Math.min(
        sourceWidth,
        imageDimensions.width - clampedSourceX,
      );
      const clampedSourceHeight = Math.min(
        sourceHeight,
        imageDimensions.height - clampedSourceY,
      );

      // Draw the cropped portion of the image onto the canvas
      ctx.drawImage(
        img,
        clampedSourceX,
        clampedSourceY,
        clampedSourceWidth,
        clampedSourceHeight, // Source rectangle
        0,
        0,
        acceptingWidth,
        acceptingHeight, // Destination rectangle
      );

      // Convert canvas to data URL
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error cropping image:', error);
      return null;
    }
  };

  const convertToFile = async (
    base64File: string,
    fileName: string,
  ): Promise<File> => {
    // Extract content type from base64 string
    const contentType = base64File.split(';')[0].split(':')[1];

    // Convert the base64 encoded image to a blob
    const base64Response = await fetch(base64File);
    const blob = await base64Response.blob();

    // Create a file from the blob
    return new File([blob], fileName, { type: contentType });
  };

  const handleConfirm = async (): Promise<void> => {
    // Get the cropped image
    const croppedImageData = cropImage();

    if (!croppedImageData) {
      throw new Error('image data not present');
    }
    const file = await convertToFile(croppedImageData, fileName);

    const result: ImageResult = {
      imageData: image,
      croppedImageBase64: croppedImageData,
      croppedImageFile: file,
      position,
      scale,
    };
    // console.log('Image set as object:', result);

    // If onConfirm prop is provided, call it with the result
    if (onConfirm) {
      onConfirm(result);
    }

    // Close the dialog
    handleCloseDialog();
  };

  // Fix: Update the global scale on dialog open and when container ref is available
  useEffect(() => {
    if (isOpen && imgContainerRef.current) {
      const containerWidth = imgContainerRef.current.clientWidth;
      const containerHeight = imgContainerRef.current.clientHeight;

      // Set a fixed maximum percentage of container dimensions for the highlight area
      const maxHighlightWidth = containerWidth * 0.8; // 80% of container width
      const maxHighlightHeight = containerHeight * 0.8; // 80% of container height

      // Calculate scale factors
      const scaleFactorWidth = maxHighlightWidth / acceptingWidth;
      const scaleFactorHeight = maxHighlightHeight / acceptingHeight;

      // Use the smaller scale factor to ensure the entire highlighted area fits
      const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);

      // ignore the scale down below 1
      const finalScale = Math.min(1, scaleFactor);

      // Update the global scale
      setGlobalScale(finalScale);
    }
  }, [isOpen, acceptingWidth, acceptingHeight, imgContainerRef.current]);

  return (
    <div className="flex flex-col items-center">
      <TooltipBtn
        icon={Camera}
        text="Change Photo"
        onClick={handleOpenDialog}
        className={`${buttonClassName}`}
      />

      <Dialog open={isOpen} onOpenChange={(e) => setIsOpen(e)}>
        <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
          <DialogHeader>
            <DialogTitle>Upload and Adjust Image</DialogTitle>
          </DialogHeader>

          <AlertBox
            onAlertOpenChange={setAlertOpen}
            IconElement={<BanIcon className="w-6 h-6 text-red-500" />}
            alertOpen={alertOpen}
            title={'Error'}
            message={imageError || 'Image not valid'}
            continueBtn="Ok"
            cancelBtn={null}
          />

          <div className="w-full max-w-full overflow-hidden">
            {!image ? (
              <Card
                className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex flex-col items-center justify-center cursor-pointer"
                onClick={handleButtonClick}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                />
                <Upload className="w-12 h-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Drag & drop an image or click to browse
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Image size must be at least {minWidth}x{minHeight} pixels
                </p>
              </Card>
            ) : (
              <div
                className="relative h-64 w-full overflow-hidden bg-gray-700 rounded-lg flex items-center justify-center"
                ref={imgContainerRef}
              >
                {/* Dark overlay with highlighted area */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={`absolute ${shape === 'circle' ? 'rounded-full' : 'rounded-none'}`}
                    style={{
                      width: acceptingWidth * globalScale,
                      height: acceptingHeight * globalScale,
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
                      zIndex: 1,
                    }}
                  />
                </div>

                {/* Image container */}
                <div
                  className="absolute flex items-center justify-center"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: 'center',
                  }}
                >
                  <img
                    src={image}
                    alt="Preview"
                    className="max-w-none max-h-none"
                    draggable="false"
                    style={{
                      width: imageDimensions?.width,
                      height: imageDimensions?.height,
                    }}
                  />
                </div>

                {/* High z-index drag overlay */}
                <motion.div
                  className="absolute inset-0 cursor-grab active:cursor-grabbing z-10"
                  drag
                  dragConstraints={imgContainerRef}
                  dragElastic={0.1}
                  dragMomentum={false}
                  onDrag={handleDragging}
                  style={{
                    touchAction: 'none',
                    userSelect: 'none',
                  }}
                />

                <div className="absolute bottom-2 right-2 flex gap-2 bg-black bg-opacity-50 p-2 rounded-md z-20">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white p-1 h-8 w-8"
                    onClick={handleZoomIn}
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white p-1 h-8 w-8"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white p-1 h-8 w-8"
                    onClick={handleResetZoom}
                    title="Reset View"
                  >
                    <RefreshCcwDot size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white p-1 h-8 w-8"
                    onClick={handleRemoveImage}
                    title="Reset View"
                  >
                    <LucideDelete size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!image || !!imageError}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
