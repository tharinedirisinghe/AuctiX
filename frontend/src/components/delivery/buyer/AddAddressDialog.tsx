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
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MapPin, AlertTriangle, Check, ChevronsUpDown } from 'lucide-react';
import { getUserAddress } from '@/services/addressService';

// List of countries for the combobox
const countries = [
  { label: 'Afghanistan', value: 'afghanistan' },
  { label: 'Albania', value: 'albania' },
  { label: 'Algeria', value: 'algeria' },
  { label: 'Andorra', value: 'andorra' },
  { label: 'Angola', value: 'angola' },
  { label: 'Antigua and Barbuda', value: 'antigua-and-barbuda' },
  { label: 'Argentina', value: 'argentina' },
  { label: 'Armenia', value: 'armenia' },
  { label: 'Australia', value: 'australia' },
  { label: 'Austria', value: 'austria' },
  { label: 'Azerbaijan', value: 'azerbaijan' },
  { label: 'Bahamas', value: 'bahamas' },
  { label: 'Bahrain', value: 'bahrain' },
  { label: 'Bangladesh', value: 'bangladesh' },
  { label: 'Barbados', value: 'barbados' },
  { label: 'Belarus', value: 'belarus' },
  { label: 'Belgium', value: 'belgium' },
  { label: 'Belize', value: 'belize' },
  { label: 'Benin', value: 'benin' },
  { label: 'Bhutan', value: 'bhutan' },
  { label: 'Bolivia', value: 'bolivia' },
  { label: 'Bosnia and Herzegovina', value: 'bosnia-and-herzegovina' },
  { label: 'Botswana', value: 'botswana' },
  { label: 'Brazil', value: 'brazil' },
  { label: 'Brunei', value: 'brunei' },
  { label: 'Bulgaria', value: 'bulgaria' },
  { label: 'Burkina Faso', value: 'burkina-faso' },
  { label: 'Burundi', value: 'burundi' },
  { label: 'Cabo Verde', value: 'cabo-verde' },
  { label: 'Cambodia', value: 'cambodia' },
  { label: 'Cameroon', value: 'cameroon' },
  { label: 'Canada', value: 'canada' },
  { label: 'Central African Republic', value: 'central-african-republic' },
  { label: 'Chad', value: 'chad' },
  { label: 'Chile', value: 'chile' },
  { label: 'China', value: 'china' },
  { label: 'Colombia', value: 'colombia' },
  { label: 'Comoros', value: 'comoros' },
  { label: 'Congo', value: 'congo' },
  { label: 'Costa Rica', value: 'costa-rica' },
  { label: 'Croatia', value: 'croatia' },
  { label: 'Cuba', value: 'cuba' },
  { label: 'Cyprus', value: 'cyprus' },
  { label: 'Czech Republic', value: 'czech-republic' },
  { label: 'Denmark', value: 'denmark' },
  { label: 'Djibouti', value: 'djibouti' },
  { label: 'Dominica', value: 'dominica' },
  { label: 'Dominican Republic', value: 'dominican-republic' },
  { label: 'East Timor', value: 'east-timor' },
  { label: 'Ecuador', value: 'ecuador' },
  { label: 'Egypt', value: 'egypt' },
  { label: 'El Salvador', value: 'el-salvador' },
  { label: 'Equatorial Guinea', value: 'equatorial-guinea' },
  { label: 'Eritrea', value: 'eritrea' },
  { label: 'Estonia', value: 'estonia' },
  { label: 'Eswatini', value: 'eswatini' },
  { label: 'Ethiopia', value: 'ethiopia' },
  { label: 'Fiji', value: 'fiji' },
  { label: 'Finland', value: 'finland' },
  { label: 'France', value: 'france' },
  { label: 'Gabon', value: 'gabon' },
  { label: 'Gambia', value: 'gambia' },
  { label: 'Georgia', value: 'georgia' },
  { label: 'Germany', value: 'germany' },
  { label: 'Ghana', value: 'ghana' },
  { label: 'Greece', value: 'greece' },
  { label: 'Grenada', value: 'grenada' },
  { label: 'Guatemala', value: 'guatemala' },
  { label: 'Guinea', value: 'guinea' },
  { label: 'Guinea-Bissau', value: 'guinea-bissau' },
  { label: 'Guyana', value: 'guyana' },
  { label: 'Haiti', value: 'haiti' },
  { label: 'Honduras', value: 'honduras' },
  { label: 'Hungary', value: 'hungary' },
  { label: 'Iceland', value: 'iceland' },
  { label: 'India', value: 'india' },
  { label: 'Indonesia', value: 'indonesia' },
  { label: 'Iran', value: 'iran' },
  { label: 'Iraq', value: 'iraq' },
  { label: 'Ireland', value: 'ireland' },
  { label: 'Israel', value: 'israel' },
  { label: 'Italy', value: 'italy' },
  { label: 'Jamaica', value: 'jamaica' },
  { label: 'Japan', value: 'japan' },
  { label: 'Jordan', value: 'jordan' },
  { label: 'Kazakhstan', value: 'kazakhstan' },
  { label: 'Kenya', value: 'kenya' },
  { label: 'Kiribati', value: 'kiribati' },
  { label: 'Korea, North', value: 'korea-north' },
  { label: 'Korea, South', value: 'korea-south' },
  { label: 'Kosovo', value: 'kosovo' },
  { label: 'Kuwait', value: 'kuwait' },
  { label: 'Kyrgyzstan', value: 'kyrgyzstan' },
  { label: 'Laos', value: 'laos' },
  { label: 'Latvia', value: 'latvia' },
  { label: 'Lebanon', value: 'lebanon' },
  { label: 'Lesotho', value: 'lesotho' },
  { label: 'Liberia', value: 'liberia' },
  { label: 'Libya', value: 'libya' },
  { label: 'Liechtenstein', value: 'liechtenstein' },
  { label: 'Lithuania', value: 'lithuania' },
  { label: 'Luxembourg', value: 'luxembourg' },
  { label: 'Madagascar', value: 'madagascar' },
  { label: 'Malawi', value: 'malawi' },
  { label: 'Malaysia', value: 'malaysia' },
  { label: 'Maldives', value: 'maldives' },
  { label: 'Mali', value: 'mali' },
  { label: 'Malta', value: 'malta' },
  { label: 'Marshall Islands', value: 'marshall-islands' },
  { label: 'Mauritania', value: 'mauritania' },
  { label: 'Mauritius', value: 'mauritius' },
  { label: 'Mexico', value: 'mexico' },
  { label: 'Micronesia', value: 'micronesia' },
  { label: 'Moldova', value: 'moldova' },
  { label: 'Monaco', value: 'monaco' },
  { label: 'Mongolia', value: 'mongolia' },
  { label: 'Montenegro', value: 'montenegro' },
  { label: 'Morocco', value: 'morocco' },
  { label: 'Mozambique', value: 'mozambique' },
  { label: 'Myanmar', value: 'myanmar' },
  { label: 'Namibia', value: 'namibia' },
  { label: 'Nauru', value: 'nauru' },
  { label: 'Nepal', value: 'nepal' },
  { label: 'Netherlands', value: 'netherlands' },
  { label: 'New Zealand', value: 'new-zealand' },
  { label: 'Nicaragua', value: 'nicaragua' },
  { label: 'Niger', value: 'niger' },
  { label: 'Nigeria', value: 'nigeria' },
  { label: 'North Macedonia', value: 'north-macedonia' },
  { label: 'Norway', value: 'norway' },
  { label: 'Oman', value: 'oman' },
  { label: 'Pakistan', value: 'pakistan' },
  { label: 'Palau', value: 'palau' },
  { label: 'Panama', value: 'panama' },
  { label: 'Papua New Guinea', value: 'papua-new-guinea' },
  { label: 'Paraguay', value: 'paraguay' },
  { label: 'Peru', value: 'peru' },
  { label: 'Philippines', value: 'philippines' },
  { label: 'Poland', value: 'poland' },
  { label: 'Portugal', value: 'portugal' },
  { label: 'Qatar', value: 'qatar' },
  { label: 'Romania', value: 'romania' },
  { label: 'Russia', value: 'russia' },
  { label: 'Rwanda', value: 'rwanda' },
  { label: 'Saint Kitts and Nevis', value: 'saint-kitts-and-nevis' },
  { label: 'Saint Lucia', value: 'saint-lucia' },
  {
    label: 'Saint Vincent and the Grenadines',
    value: 'saint-vincent-and-the-grenadines',
  },
  { label: 'Samoa', value: 'samoa' },
  { label: 'San Marino', value: 'san-marino' },
  { label: 'Sao Tome and Principe', value: 'sao-tome-and-principe' },
  { label: 'Saudi Arabia', value: 'saudi-arabia' },
  { label: 'Senegal', value: 'senegal' },
  { label: 'Serbia', value: 'serbia' },
  { label: 'Seychelles', value: 'seychelles' },
  { label: 'Sierra Leone', value: 'sierra-leone' },
  { label: 'Singapore', value: 'singapore' },
  { label: 'Slovakia', value: 'slovakia' },
  { label: 'Slovenia', value: 'slovenia' },
  { label: 'Solomon Islands', value: 'solomon-islands' },
  { label: 'Somalia', value: 'somalia' },
  { label: 'South Africa', value: 'south-africa' },
  { label: 'South Sudan', value: 'south-sudan' },
  { label: 'Spain', value: 'spain' },
  { label: 'Sri Lanka', value: 'sri-lanka' },
  { label: 'Sudan', value: 'sudan' },
  { label: 'Suriname', value: 'suriname' },
  { label: 'Sweden', value: 'sweden' },
  { label: 'Switzerland', value: 'switzerland' },
  { label: 'Syria', value: 'syria' },
  { label: 'Taiwan', value: 'taiwan' },
  { label: 'Tajikistan', value: 'tajikistan' },
  { label: 'Tanzania', value: 'tanzania' },
  { label: 'Thailand', value: 'thailand' },
  { label: 'Togo', value: 'togo' },
  { label: 'Tonga', value: 'tonga' },
  { label: 'Trinidad and Tobago', value: 'trinidad-and-tobago' },
  { label: 'Tunisia', value: 'tunisia' },
  { label: 'Turkey', value: 'turkey' },
  { label: 'Turkmenistan', value: 'turkmenistan' },
  { label: 'Tuvalu', value: 'tuvalu' },
  { label: 'Uganda', value: 'uganda' },
  { label: 'Ukraine', value: 'ukraine' },
  { label: 'United Arab Emirates', value: 'united-arab-emirates' },
  { label: 'United Kingdom', value: 'united-kingdom' },
  { label: 'United States', value: 'united-states' },
  { label: 'Uruguay', value: 'uruguay' },
  { label: 'Uzbekistan', value: 'uzbekistan' },
  { label: 'Vanuatu', value: 'vanuatu' },
  { label: 'Vatican City', value: 'vatican-city' },
  { label: 'Venezuela', value: 'venezuela' },
  { label: 'Vietnam', value: 'vietnam' },
  { label: 'Yemen', value: 'yemen' },
  { label: 'Zambia', value: 'zambia' },
  { label: 'Zimbabwe', value: 'zimbabwe' },
];

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
  const [open, setOpen] = useState(false);
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
    setOpen(false);
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
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                          'w-full justify-between',
                          !addressData.country && 'text-muted-foreground',
                          errors.country && 'border-red-500'
                        )}
                      >
                        {addressData.country
                          ? countries.find(
                              (country) => country.value === addressData.country,
                            )?.label
                          : 'Select country'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search country..." />
                        <CommandList>
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup className="max-h-[300px] overflow-y-auto">
                            {countries.map((country) => (
                              <CommandItem
                                key={country.value}
                                value={country.value}
                                onSelect={(value) => {
                                  handleInputChange('country', value);
                                  setOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    addressData.country === country.value
                                      ? 'opacity-100'
                                      : 'opacity-0',
                                  )}
                                />
                                {country.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
