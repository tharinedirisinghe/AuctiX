import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, AlertTriangle } from 'lucide-react';
import { getUserAddress } from '@/services/addressService';

interface AddAddressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (addressData: AddressData) => void;
  isLoading?: boolean;
  deliveryId: string;
}

export interface AddressData {
  addressNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export const AddAddressDialog: React.FC<AddAddressDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [addressData, setAddressData] = useState<AddressData>({
    addressNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  const [errors, setErrors] = useState<Partial<AddressData>>({});
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Load existing address when dialog opens
  useEffect(() => {
    const loadExistingAddress = async () => {
      if (isOpen) {
        setIsLoadingAddress(true);
        try {
          const existingAddress = await getUserAddress();
          if (existingAddress) {
            setAddressData({
              addressNumber: existingAddress.addressNumber || '',
              addressLine1: existingAddress.addressLine1 || '',
              addressLine2: existingAddress.addressLine2 || '',
              city: existingAddress.city || '',
              state: existingAddress.state || '',
              postalCode: existingAddress.postalCode || '',
              country: existingAddress.country || '',
            });
          }
        } catch {
          // If no address exists (404), keep empty form
          console.log('No existing address found, keeping empty form');
        } finally {
          setIsLoadingAddress(false);
        }
      }
    };

    loadExistingAddress();
  }, [isOpen]);

  const handleInputChange = (field: keyof AddressData, value: string) => {
    setAddressData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AddressData> = {};

    if (!addressData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address line 1 is required';
    }
    if (!addressData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!addressData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!addressData.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    }
    if (!addressData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(addressData);
    }
  };

  const handleClose = () => {
    // Reset form data
    setAddressData({
      addressNumber: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    });
    setErrors({});
    setIsLoadingAddress(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-600" />
            Add Delivery Address
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-md border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <div className="font-medium">Address Required for Delivery</div>
                <div>
                  Please provide your delivery address so the seller can process
                  your order.
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {isLoadingAddress ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">
                Loading existing address...
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="addressNumber" className="text-right">
                  Number
                </Label>
                <Input
                  id="addressNumber"
                  value={addressData.addressNumber}
                  onChange={(e) =>
                    handleInputChange('addressNumber', e.target.value)
                  }
                  className="col-span-3"
                  placeholder="House/Building number"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="addressLine1" className="text-right">
                  Address Line 1 *
                </Label>
                <div className="col-span-3">
                  <Input
                    id="addressLine1"
                    value={addressData.addressLine1}
                    onChange={(e) =>
                      handleInputChange('addressLine1', e.target.value)
                    }
                    className={errors.addressLine1 ? 'border-red-500' : ''}
                    placeholder="Street address"
                  />
                  {errors.addressLine1 && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.addressLine1}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="addressLine2" className="text-right">
                  Address Line 2
                </Label>
                <Input
                  id="addressLine2"
                  value={addressData.addressLine2}
                  onChange={(e) =>
                    handleInputChange('addressLine2', e.target.value)
                  }
                  className="col-span-3"
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="city" className="text-right">
                  City *
                </Label>
                <div className="col-span-3">
                  <Input
                    id="city"
                    value={addressData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={errors.city ? 'border-red-500' : ''}
                    placeholder="City"
                  />
                  {errors.city && (
                    <p className="text-sm text-red-500 mt-1">{errors.city}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="state" className="text-right">
                  State *
                </Label>
                <div className="col-span-3">
                  <Input
                    id="state"
                    value={addressData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className={errors.state ? 'border-red-500' : ''}
                    placeholder="State/Province"
                  />
                  {errors.state && (
                    <p className="text-sm text-red-500 mt-1">{errors.state}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="postalCode" className="text-right">
                  Postal Code *
                </Label>
                <div className="col-span-3">
                  <Input
                    id="postalCode"
                    value={addressData.postalCode}
                    onChange={(e) =>
                      handleInputChange('postalCode', e.target.value)
                    }
                    className={errors.postalCode ? 'border-red-500' : ''}
                    placeholder="Postal/ZIP code"
                  />
                  {errors.postalCode && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.postalCode}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="country" className="text-right">
                  Country *
                </Label>
                <div className="col-span-3">
                  <Input
                    id="country"
                    value={addressData.country}
                    onChange={(e) =>
                      handleInputChange('country', e.target.value)
                    }
                    className={errors.country ? 'border-red-500' : ''}
                    placeholder="Country"
                  />
                  {errors.country && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.country}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading || isLoadingAddress}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || isLoadingAddress}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isLoading
              ? 'Saving...'
              : isLoadingAddress
                ? 'Loading...'
                : 'Save Address'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
